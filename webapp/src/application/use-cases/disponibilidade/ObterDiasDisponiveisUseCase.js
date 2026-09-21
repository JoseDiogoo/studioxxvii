import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";
import { RegraNegocioError } from "@/domain/errors/DomainError";

export class ObterDiasDisponiveisUseCase {
  constructor({ servicoRepository, colaboradorRepository, horarioRepository, agendamentoRepository }) {
    this.servicoRepository = servicoRepository;
    this.colaboradorRepository = colaboradorRepository;
    this.horarioRepository = horarioRepository;
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ servicos, ano, mes }) {
    if (!Array.isArray(servicos) || servicos.length === 0) {
      throw new RegraNegocioError("É preciso escolher pelo menos um serviço.");
    }

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
        return { diasDisponiveis: [] };
      }

      servicosPreparados.push({
        servicoId: s.servicoId,
        elegiveis,
        duracaoMinutos: sDb.duracaoMinutos,
        preco: sDb.preco,
      });
    }

    const colaboradorIds = [...new Set(servicosPreparados.flatMap((s) => s.elegiveis))];
    const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const dataInicio = new Date(Date.UTC(ano, mes - 1, 1));
    const dataFim = new Date(Date.UTC(ano, mes - 1, diasNoMes, 23, 59, 59, 999));

    // Carregar todos os agendamentos e horários do mês de uma só vez
    const [todosHorarios, todosAgendamentos] = await Promise.all([
      Promise.all([0, 1, 2, 3, 4, 5, 6].map((diaSemana) =>
        this.horarioRepository.findByColaboradoresEDiaSemana(colaboradorIds, diaSemana)
      )),
      this.agendamentoRepository.findByColaboradoresEData(colaboradorIds, dataInicio, dataFim),
    ]);

    const horariosPorDiaSemana = todosHorarios; // Array indexado por 0..6

    // Agrupar agendamentos por string "YYYY-MM-DD"
    const agendamentosPorDia = new Map();
    for (const a of todosAgendamentos) {
      const chave = a.data.toISOString().slice(0, 10);
      if (!agendamentosPorDia.has(chave)) agendamentosPorDia.set(chave, []);
      agendamentosPorDia.get(chave).push(a);
    }

    const hojeUtc = new Date();
    const hojeStr = hojeUtc.toISOString().slice(0, 10);
    const minutosAgora = hojeUtc.getUTCHours() * 60 + hojeUtc.getUTCMinutes();

    const diasDisponiveis = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataCorrente = new Date(Date.UTC(ano, mes - 1, dia));
      const dataStr = dataCorrente.toISOString().slice(0, 10);

      // Não permitir dias passados
      if (dataStr < hojeStr) continue;

      const diaSemana = dataCorrente.getUTCDay();
      const horariosDoDia = horariosPorDiaSemana[diaSemana] || [];
      const agendamentosDoDia = agendamentosPorDia.get(dataStr) || [];

      const ehHoje = dataStr === hojeStr;

      const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
        servicosPreparados,
        horarios: horariosDoDia,
        agendamentos: agendamentosDoDia,
        ehHoje,
        minutosAgora: ehHoje ? minutosAgora : 0,
      });

      if (slots.length > 0) {
        diasDisponiveis.push(dataStr);
      }
    }

    return { diasDisponiveis };
  }
}
