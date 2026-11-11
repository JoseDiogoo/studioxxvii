import crypto from "crypto";
import { SlotIndisponivelError, RegraNegocioError } from "@/domain/errors/DomainError";
import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";

const MAX_DIAS_ANTECEDENCIA = 60;
const MAX_PENDENTES_POR_TELEFONE = 3;

// Dia (AAAA-MM-DD) e hora (HH:MM) atuais em Lisboa, independentemente do fuso do servidor.
function agoraEmLisboa() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return { hoje: `${partes.year}-${partes.month}-${partes.day}`, agora: `${partes.hour}:${partes.minute}` };
}

function somarDiasChave(chave, n) {
  const d = new Date(`${chave}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export class CriarAgendamentoPublicoUseCase {
  constructor({
    agendamentoRepository,
    colaboradorRepository,
    servicoRepository,
    horarioRepository,
    salaoRepository,
    notificationGateway,
  }) {
    this.agendamentoRepository = agendamentoRepository;
    this.colaboradorRepository = colaboradorRepository;
    this.servicoRepository = servicoRepository;
    this.horarioRepository = horarioRepository;
    this.salaoRepository = salaoRepository;
    this.notificationGateway = notificationGateway;
  }

  // porEquipa: marcação registada pelo barbeiro (pedido por Instagram/WhatsApp). Ocupa a hora como qualquer outra,
  // mas não tem limite de pendentes, aceita horas já passadas hoje e não avisa o barbeiro (foi ele que a criou).
  async execute({ cliente, servicos, data, horaInicio, empresaSite = null, porEquipa = false }) {
    // 1. Honeypot check
    if (empresaSite) {
      return {
        grupoId: crypto.randomUUID(),
        data,
        horaInicio,
        total: 0,
      };
    }

    if (!Array.isArray(servicos) || servicos.length === 0) {
      throw new RegraNegocioError("É preciso escolher pelo menos um serviço.");
    }

    // Data e hora: tem de ser um dia real, não passado, e dentro da janela que o site mostra.
    const { hoje, agora } = agoraEmLisboa();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(new Date(`${data}T00:00:00.000Z`).getTime())) {
      throw new RegraNegocioError("Data inválida.");
    }
    if (data < hoje || data > somarDiasChave(hoje, MAX_DIAS_ANTECEDENCIA) || (!porEquipa && data === hoje && horaInicio <= agora)) {
      throw new SlotIndisponivelError("Essa data ou hora já não está disponível. Escolhe outra.");
    }

    // Limite de marcações pendentes por telefone: um robô com IPs diferentes não consegue encher a agenda.
    const pendentes = porEquipa ? 0 : await this.agendamentoRepository.contarPendentesPorTelefone(cliente.telefone, hoje);
    if (pendentes >= MAX_PENDENTES_POR_TELEFONE) {
      throw new RegraNegocioError(
        `Já tens ${MAX_PENDENTES_POR_TELEFONE} marcações por realizar. Espera pela próxima antes de marcar outra.`
      );
    }

    // 2. Carregar serviços da BD
    const servicoIds = servicos.map((s) => s.servicoId);
    const servicosDb = await this.servicoRepository.findByIds(servicoIds);
    const mapServicos = new Map(servicosDb.map((s) => [s.id, s]));

    const servicosPreparados = [];
    for (const s of servicos) {
      const sDb = mapServicos.get(s.servicoId);
      if (!sDb) throw new RegraNegocioError("Serviço inválido.");

      // Só profissionais ativos que fazem este serviço; um colaboradorId enviado pelo cliente tem de estar nessa lista.
      const colabs = await this.colaboradorRepository.findElegiveisPorServico(s.servicoId);
      let elegiveis = colabs.map((c) => c.colaboradorId || c.id);
      if (s.colaboradorId) {
        if (!elegiveis.includes(s.colaboradorId)) throw new RegraNegocioError("Profissional inválido para este serviço.");
        elegiveis = [s.colaboradorId];
      }

      if (elegiveis.length === 0) {
        throw new RegraNegocioError(`Sem profissional disponível para "${sDb.titulo}".`);
      }

      servicosPreparados.push({
        servicoId: s.servicoId,
        elegiveis,
        duracaoMinutos: sDb.duracaoMinutos,
        preco: sDb.preco,
        titulo: sDb.titulo,
      });
    }

    // 3. Verificar disponibilidade do slot
    const dataObj = typeof data === "string" ? new Date(`${data}T00:00:00.000Z`) : data;
    const diaSemana = dataObj.getUTCDay();
    const colaboradorIds = [...new Set(servicosPreparados.flatMap((s) => s.elegiveis))];

    const [horarios, agendamentosExistentes] = await Promise.all([
      this.horarioRepository.findByColaboradoresEDiaSemana(colaboradorIds, diaSemana),
      this.agendamentoRepository.findByColaboradoresEData(colaboradorIds, dataObj, dataObj),
    ]);

    const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
      servicosPreparados,
      horarios,
      agendamentos: agendamentosExistentes,
      ehHoje: false,
    });

    const slotEscolhido = slots.find((s) => s.horaInicio === horaInicio);
    if (!slotEscolhido) {
      throw new SlotIndisponivelError();
    }

    // 4. Obter Salão e executar transação
    const salao = await this.salaoRepository.getPrimeiroSalao();
    const salaoId = salao.id;
    const grupoId = crypto.randomUUID();
    const precoPorServico = new Map(servicosPreparados.map((s) => [s.servicoId, s.preco]));

    const agendamentosParaCriar = slotEscolhido.atribuicao.map((item) => ({
      grupoId,
      colaboradorId: item.colaboradorId,
      servicoId: item.servicoId,
      data: dataObj,
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      valor: precoPorServico.get(item.servicoId) ?? 0,
    }));

    const resultado = await this.agendamentoRepository.criarAgendamentosEmTransacao({
      clienteData: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || null,
        observacoes: cliente.observacoes || null,
      },
      agendamentosData: agendamentosParaCriar,
      salaoId,
      dia: dataObj,
    });

    const total = Math.round(resultado.agendamentos.reduce((acc, a) => acc + a.valor, 0) * 100) / 100;

    // 5. Notificação por WhatsApp (assíncrona)
    if (this.notificationGateway && resultado.agendamentos.length > 0) {
      const primeiro = resultado.agendamentos[0];
      const titulos = servicosPreparados.map((s) => s.titulo).join(" + ");
      const dataStr = typeof data === "string" ? data : data.toISOString().slice(0, 10);

      this.notificationGateway.enviarConfirmacao({
        email: cliente.email || null,
        telefone: cliente.telefone,
        nomeCliente: cliente.nome,
        servicoTitulo: titulos,
        dataStr,
        horaInicio,
      }).catch(() => {});

      if (!porEquipa) this.notificationGateway.enviarNovaMarcacaoBarbeiro({
        nomeCliente: cliente.nome,
        telefoneCliente: cliente.telefone,
        servicoTitulo: titulos,
        dataStr,
        horaInicio,
      }).catch(() => {});
    }

    return {
      grupoId,
      data: typeof data === "string" ? data : data.toISOString().slice(0, 10),
      horaInicio,
      total,
    };
  }
}
