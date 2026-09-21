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

  async upsertCliente({ salaoId, nome, telefone, email, observacoes }) {
    throw new Error("Método upsertCliente não implementado.");
  }
}
