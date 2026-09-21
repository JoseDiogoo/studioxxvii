import { EntidadeNaoEncontradaError, RegraNegocioError } from "@/domain/errors/DomainError";
import { HorarioSlot } from "@/domain/value-objects/HorarioSlot";

export class ReagendarAgendamentoUseCase {
  constructor({ agendamentoRepository, calendarGateway, notificationGateway }) {
    this.agendamentoRepository = agendamentoRepository;
    this.calendarGateway = calendarGateway;
    this.notificationGateway = notificationGateway;
  }

  async execute({ id, data, horaInicio, colaboradorId }) {
    const agendamento = await this.agendamentoRepository.findById(id);
    if (!agendamento) {
      throw new EntidadeNaoEncontradaError("Agendamento", id);
    }

    const duracao = HorarioSlot.timeToMinutes(agendamento.horaFim) - HorarioSlot.timeToMinutes(agendamento.horaInicio);
    const startMin = HorarioSlot.timeToMinutes(horaInicio);
    const novaHoraFim = HorarioSlot.minutesToTime(startMin + duracao);

    const dataObj = typeof data === "string" ? new Date(`${data}T00:00:00.000Z`) : data;

    const atualizado = await this.agendamentoRepository.update(id, {
      data: dataObj,
      horaInicio,
      horaFim: novaHoraFim,
      colaboradorId: colaboradorId || agendamento.colaboradorId,
    });

    if (this.calendarGateway) {
      this.calendarGateway.sincronizarEvento(atualizado).catch(() => {});
    }

    if (this.notificationGateway && atualizado.cliente) {
      const dataStr = typeof data === "string" ? data : data.toISOString().slice(0, 10);
      this.notificationGateway.enviarReagendamento({
        telefone: atualizado.cliente.telefone,
        nomeCliente: atualizado.cliente.nome,
        servicoTitulo: atualizado.servico?.titulo || "Serviço",
        dataStr,
        horaInicio,
      }).catch(() => {});
    }

    return atualizado;
  }
}
