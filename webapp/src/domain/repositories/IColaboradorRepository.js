/**
 * @interface IColaboradorRepository
 */
export class IColaboradorRepository {
  async findById(id) {
    throw new Error("Método findById não implementado.");
  }

  async findByEmail(email) {
    throw new Error("Método findByEmail não implementado.");
  }

  async findAtivos() {
    throw new Error("Método findAtivos não implementado.");
  }

  async findElegiveisPorServico(servicoId) {
    throw new Error("Método findElegiveisPorServico não implementado.");
  }

  async update(id, dados) {
    throw new Error("Método update não implementado.");
  }
}
