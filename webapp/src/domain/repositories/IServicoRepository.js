/**
 * @interface IServicoRepository
 */
export class IServicoRepository {
  async findById(id) {
    throw new Error("Método findById não implementado.");
  }

  async findByIds(ids) {
    throw new Error("Método findByIds não implementado.");
  }

  async findAtivos() {
    throw new Error("Método findAtivos não implementado.");
  }
}
