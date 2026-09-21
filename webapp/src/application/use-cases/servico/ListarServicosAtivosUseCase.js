export class ListarServicosAtivosUseCase {
  constructor({ servicoRepository }) {
    this.servicoRepository = servicoRepository;
  }

  async execute() {
    return await this.servicoRepository.findAtivos();
  }
}
