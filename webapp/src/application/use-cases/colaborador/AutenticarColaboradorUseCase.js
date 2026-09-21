export class AutenticarColaboradorUseCase {
  constructor({ colaboradorRepository, passwordHasher }) {
    this.colaboradorRepository = colaboradorRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, password }) {
    if (!email || !password) return null;

    const colaborador = await this.colaboradorRepository.findByEmail(email);
    if (!colaborador || !colaborador.ativo) return null;

    const isValid = await this.passwordHasher.compare(password, colaborador.passwordHash);
    if (!isValid) return null;

    return {
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      salaoId: colaborador.salaoId,
    };
  }
}
