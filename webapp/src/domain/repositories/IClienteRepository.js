/**
 * @interface IClienteRepository
 */
export class IClienteRepository {
  async findById(id) {
    throw new Error("Método findById não implementado.");
  }

  async findByTelefoneESalao(salaoId, telefone) {
    throw new Error("Método findByTelefoneESalao não implementado.");
  }
}
