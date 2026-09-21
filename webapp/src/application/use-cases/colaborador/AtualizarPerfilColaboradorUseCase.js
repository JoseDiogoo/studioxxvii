import { EntidadeNaoEncontradaError, RegraNegocioError } from "@/domain/errors/DomainError";

export class AtualizarPerfilColaboradorUseCase {
  constructor({ colaboradorRepository, passwordHasher }) {
    this.colaboradorRepository = colaboradorRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ colaboradorId, nome, passwordAtual, novaPassword }) {
    const colaborador = await this.colaboradorRepository.findById(colaboradorId);
    if (!colaborador) {
      throw new EntidadeNaoEncontradaError("Colaborador", colaboradorId);
    }

    const dadosUpdate = {};
    if (nome) dadosUpdate.nome = nome.trim();

    if (novaPassword) {
      if (!passwordAtual) {
        throw new RegraNegocioError("A password atual é necessária para definir uma nova password.");
      }
      const senhaCorreta = await this.passwordHasher.compare(passwordAtual, colaborador.passwordHash);
      if (!senhaCorreta) {
        throw new RegraNegocioError("Password atual incorreta.");
      }
      dadosUpdate.passwordHash = await this.passwordHasher.hash(novaPassword);
    }

    return await this.colaboradorRepository.update(colaboradorId, dadosUpdate);
  }
}
