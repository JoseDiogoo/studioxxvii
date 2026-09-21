import { EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";

export class RegistarPagamentoUseCase {
  constructor({ agendamentoRepository }) {
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ id, pago, metodoPagamento }) {
    const agendamento = await this.agendamentoRepository.findById(id);
    if (!agendamento) {
      throw new EntidadeNaoEncontradaError("Agendamento", id);
    }

    return await this.agendamentoRepository.update(id, {
      pago: Boolean(pago),
      metodoPagamento: pago ? metodoPagamento : null,
    });
  }
}
