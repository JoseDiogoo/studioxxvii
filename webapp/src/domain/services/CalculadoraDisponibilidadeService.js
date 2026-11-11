import { HorarioSlot } from "../value-objects/HorarioSlot";

const SLOT_STEP_MINUTES = 30;

export class CalculadoraDisponibilidadeService {
  /**
   * Constrói mapas de horários de trabalho e intervalos ocupados a partir dos dados brutos.
   */
  static estruturarContexto(horarios, agendamentos) {
    const horarioPorColaborador = new Map();
    for (const h of horarios) {
      if (!horarioPorColaborador.has(h.colaboradorId)) {
        horarioPorColaborador.set(h.colaboradorId, []);
      }
      horarioPorColaborador.get(h.colaboradorId).push(h);
    }

    const ocupadoPorColaborador = new Map();
    for (const a of agendamentos) {
      if (a.status === "CANCELADO") continue;
      if (!ocupadoPorColaborador.has(a.colaboradorId)) {
        ocupadoPorColaborador.set(a.colaboradorId, []);
      }
      ocupadoPorColaborador.get(a.colaboradorId).push([
        HorarioSlot.timeToMinutes(a.horaInicio),
        HorarioSlot.timeToMinutes(a.horaFim),
      ]);
    }

    return { horarioPorColaborador, ocupadoPorColaborador };
  }

  /**
   * Verifica se um colaborador está livre e sem conflito de agendamento.
   * O horário de trabalho (ex.: 10:00–19:00) limita só a HORA DE INÍCIO: a última marcação pode começar às 19:00
   * e o serviço acabar depois. Nos serviços seguintes de uma mesma marcação (primeiro=false) basta já estar dentro do dia de trabalho.
   */
  static isColaboradorLivre(colaboradorId, inicioMin, fimMin, horarioPorColaborador, ocupadoPorColaborador, primeiro = true) {
    const horarios = horarioPorColaborador.get(colaboradorId) || [];
    const dentroDoHorario = horarios.some(
      (h) => HorarioSlot.timeToMinutes(h.inicio) <= inicioMin && (!primeiro || inicioMin <= HorarioSlot.timeToMinutes(h.fim))
    );
    if (!dentroDoHorario) return false;

    const ocupados = ocupadoPorColaborador.get(colaboradorId) || [];
    return !ocupados.some(([oi, of_]) => inicioMin < of_ && oi < fimMin);
  }

  /**
   * Tenta encaixar a sequência de serviços a partir de um minuto inicial.
   */
  static tentarEncaixe(startMin, servicosPreparados, horarioPorColaborador, ocupadoPorColaborador) {
    let cursor = startMin;
    const atribuicao = [];

    for (const [i, { servicoId, elegiveis, duracaoMinutos }] of servicosPreparados.entries()) {
      const fimServico = cursor + duracaoMinutos;
      const escolhido = elegiveis.find((cid) =>
        this.isColaboradorLivre(cid, cursor, fimServico, horarioPorColaborador, ocupadoPorColaborador, i === 0)
      );
      if (!escolhido) return null;

      atribuicao.push({
        servicoId,
        colaboradorId: escolhido,
        horaInicio: HorarioSlot.minutesToTime(cursor),
        horaFim: HorarioSlot.minutesToTime(fimServico),
      });
      cursor = fimServico;
    }

    return atribuicao;
  }

  /**
   * Calcula todos os slots disponíveis num dia para a lista de serviços preparados.
   */
  static calcularSlotsDisponiveis({
    servicosPreparados,
    horarios,
    agendamentos,
    ehHoje = false,
    minutosAgora = 0,
  }) {
    if (!servicosPreparados || servicosPreparados.length === 0) return [];

    const { horarioPorColaborador, ocupadoPorColaborador } = this.estruturarContexto(horarios, agendamentos);
    if (horarioPorColaborador.size === 0) return [];

    let minInicio = Infinity;
    let maxFim = 0;

    for (const listaHorarios of horarioPorColaborador.values()) {
      for (const h of listaHorarios) {
        minInicio = Math.min(minInicio, HorarioSlot.timeToMinutes(h.inicio));
        maxFim = Math.max(maxFim, HorarioSlot.timeToMinutes(h.fim));
      }
    }

    if (!isFinite(minInicio)) return [];

    // Inícios possíveis: de 30 em 30 minutos e também logo a seguir ao fim de cada marcação existente.
    // Assim um corte de 45 min seguido de outro não deixa 15 min mortos por não caírem na grelha.
    const inicios = new Set();
    for (let start = minInicio; start <= maxFim; start += SLOT_STEP_MINUTES) inicios.add(start);
    for (const intervalos of ocupadoPorColaborador.values()) {
      for (const [, fim] of intervalos) if (fim >= minInicio && fim <= maxFim) inicios.add(fim);
    }

    const validos = [];
    for (const start of [...inicios].sort((a, b) => a - b)) {
      if (ehHoje && start <= minutosAgora) continue;

      const atribuicao = this.tentarEncaixe(start, servicosPreparados, horarioPorColaborador, ocupadoPorColaborador);
      if (atribuicao) {
        validos.push({
          horaInicio: HorarioSlot.minutesToTime(start),
          atribuicao,
        });
      }
    }

    return validos;
  }
}
