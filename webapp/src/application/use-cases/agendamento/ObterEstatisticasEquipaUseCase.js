export class ObterEstatisticasEquipaUseCase {
  constructor({ agendamentoRepository }) {
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ colaboradorId = null, dataInicio, dataFim }) {
    return await this.agendamentoRepository.obterEstatisticas({
      colaboradorId,
      dataInicio,
      dataFim,
    });
  }
}
