import { EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";

export class ObterPerfilColaboradorUseCase {
  constructor({ colaboradorRepository }) {
    this.colaboradorRepository = colaboradorRepository;
  }

  async execute(colaboradorId) {
    const colaborador = await this.colaboradorRepository.findById(colaboradorId);
    if (!colaborador) {
      throw new EntidadeNaoEncontradaError("Colaborador", colaboradorId);
    }

    return {
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      googleConectado: Boolean(colaborador.googleRefreshToken),
      icsToken: colaborador.icsToken,
      icsUrl: colaborador.icsToken ? `/api/calendario/${colaborador.id}/${colaborador.icsToken}` : null,
    };
  }
}
