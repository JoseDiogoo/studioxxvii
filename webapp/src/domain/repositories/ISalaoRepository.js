/**
 * @interface ISalaoRepository
 */
export class ISalaoRepository {
  async getPrimeiroSalao() {
    throw new Error("Método getPrimeiroSalao não implementado.");
  }

  async findById(id) {
    throw new Error("Método findById não implementado.");
  }
}
