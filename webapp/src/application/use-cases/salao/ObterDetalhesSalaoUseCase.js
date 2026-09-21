export class ObterDetalhesSalaoUseCase {
  constructor({ salaoRepository }) {
    this.salaoRepository = salaoRepository;
  }

  async execute() {
    return await this.salaoRepository.getPrimeiroSalao();
  }
}
