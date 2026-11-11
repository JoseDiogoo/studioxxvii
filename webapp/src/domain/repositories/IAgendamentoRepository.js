/**
 * @interface IAgendamentoRepository
 */
export class IAgendamentoRepository {
  async findById(id) {
    throw new Error("Método findById não implementado.");
  }

  async contarPendentesPorTelefone(telefone, hoje) {
    throw new Error("Método contarPendentesPorTelefone não implementado.");
  }

  async findByColaboradoresEData(colaboradorIds, inicioDia, fimDia) {
    throw new Error("Método findByColaboradoresEData não implementado.");
  }

  async findParaEquipa({ colaboradorId, dataInicio, dataFim }) {
    throw new Error("Método findParaEquipa não implementado.");
  }

  async criarAgendamentosEmTransacao({ clienteData, agendamentosData, salaoId, dia }) {
    throw new Error("Método criarAgendamentosEmTransacao não implementado.");
  }

  async atualizarSemConflito(id, dados, slot) {
    throw new Error("Método atualizarSemConflito não implementado.");
  }

  async update(id, dados) {
    throw new Error("Método update não implementado.");
  }
}
