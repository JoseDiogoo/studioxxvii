/**
 * @interface IHorarioRepository
 */
export class IHorarioRepository {
  async findByColaboradoresEDiaSemana(colaboradorIds, diaSemana) {
    throw new Error("Método findByColaboradoresEDiaSemana não implementado.");
  }

  async findByColaboradorId(colaboradorId) {
    throw new Error("Método findByColaboradorId não implementado.");
  }
}
