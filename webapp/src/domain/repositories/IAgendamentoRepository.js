/**
 * @interface IAgendamentoRepository
 */
export class IAgendamentoRepository {
  async findById(id) {
    throw new Error("Método findById não implementado.");
  }

  async findByGrupoId(grupoId) {
    throw new Error("Método findByGrupoId não implementado.");
  }

  async findByColaboradoresEData(colaboradorIds, inicioDia, fimDia) {
    throw new Error("Método findByColaboradoresEData não implementado.");
  }

  async findParaEquipa({ colaboradorId, dataInicio, dataFim }) {
    throw new Error("Método findParaEquipa não implementado.");
  }

  async findHistorico({ colaboradorId, skip, take }) {
    throw new Error("Método findHistorico não implementado.");
  }

  async criarAgendamentosEmTransacao({ clienteData, agendamentosData, salaoId, dia }) {
    throw new Error("Método criarAgendamentosEmTransacao não implementado.");
  }

  async update(id, dados) {
    throw new Error("Método update não implementado.");
  }

  async delete(id) {
    throw new Error("Método delete não implementado.");
  }

  async obterEstatisticas({ colaboradorId, dataInicio, dataFim }) {
    throw new Error("Método obterEstatisticas não implementado.");
  }
}
