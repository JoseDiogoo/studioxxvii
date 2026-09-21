import { EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";
import { StatusAgendamento } from "@/domain/value-objects/Enums";

export class CancelarAgendamentoUseCase {
  constructor({ agendamentoRepository, calendarGateway, notificationGateway }) {
    this.agendamentoRepository = agendamentoRepository;
    this.calendarGateway = calendarGateway;
    this.notificationGateway = notificationGateway;
  }

  async execute(id) {
    const agendamento = await this.agendamentoRepository.findById(id);
    if (!agendamento) {
      throw new EntidadeNaoEncontradaError("Agendamento", id);
    }

    const atualizado = await this.agendamentoRepository.update(id, {
      status: StatusAgendamento.CANCELADO,
    });

    if (this.calendarGateway) {
      this.calendarGateway.removerEvento(agendamento).catch(() => {});
    }

    if (this.notificationGateway && agendamento.cliente) {
      const dataStr = agendamento.data.toISOString().slice(0, 10);
      this.notificationGateway.enviarCancelamento({
        telefone: agendamento.cliente.telefone,
        nomeCliente: agendamento.cliente.nome,
        servicoTitulo: agendamento.servico?.titulo || "Serviço",
        dataStr,
        horaInicio: agendamento.horaInicio,
      }).catch(() => {});
    }

    return atualizado;
  }
}
