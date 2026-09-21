import crypto from "crypto";
import { SlotIndisponivelError, RegraNegocioError } from "@/domain/errors/DomainError";
import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";

export class CriarAgendamentoPublicoUseCase {
  constructor({
    agendamentoRepository,
    colaboradorRepository,
    servicoRepository,
    horarioRepository,
    salaoRepository,
    calendarGateway,
    notificationGateway,
  }) {
    this.agendamentoRepository = agendamentoRepository;
    this.colaboradorRepository = colaboradorRepository;
    this.servicoRepository = servicoRepository;
    this.horarioRepository = horarioRepository;
    this.salaoRepository = salaoRepository;
    this.calendarGateway = calendarGateway;
    this.notificationGateway = notificationGateway;
  }

  async execute({ cliente, servicos, data, horaInicio, empresaSite = null }) {
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

    // 2. Carregar serviços da BD
    const servicoIds = servicos.map((s) => s.servicoId);
    const servicosDb = await this.servicoRepository.findByIds(servicoIds);
    const mapServicos = new Map(servicosDb.map((s) => [s.id, s]));

    const servicosPreparados = [];
    for (const s of servicos) {
      const sDb = mapServicos.get(s.servicoId);
      if (!sDb) throw new RegraNegocioError("Serviço inválido.");

      let elegiveis = [];
      if (s.colaboradorId) {
        elegiveis = [s.colaboradorId];
      } else {
        const colabs = await this.colaboradorRepository.findElegiveisPorServico(s.servicoId);
        elegiveis = colabs.map((c) => c.colaboradorId || c.id);
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

    const total = resultado.agendamentos.reduce((acc, a) => acc + a.valor, 0);

    // 5. Integrações assíncronas (Google Calendar e WhatsApp)
    if (this.calendarGateway) {
      for (const ag of resultado.agendamentos) {
        this.calendarGateway.sincronizarEvento(ag).catch(() => {});
      }
    }

    if (this.notificationGateway && resultado.agendamentos.length > 0) {
      const primeiro = resultado.agendamentos[0];
      const titulos = servicosPreparados.map((s) => s.titulo).join(" + ");
      const dataStr = typeof data === "string" ? data : data.toISOString().slice(0, 10);

      this.notificationGateway.enviarConfirmacao({
        telefone: cliente.telefone,
        nomeCliente: cliente.nome,
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
