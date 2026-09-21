export class ObterHistoricoAgendamentosUseCase {
  constructor({ agendamentoRepository }) {
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ colaboradorId = null, page = 1, limit = 50 }) {
    const skip = (Math.max(1, page) - 1) * limit;
    return await this.agendamentoRepository.findHistorico({
      colaboradorId,
      skip,
      take: limit,
    });
  }
}
