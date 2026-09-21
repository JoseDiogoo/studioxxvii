export class ObterAgendamentosEquipaUseCase {
  constructor({ agendamentoRepository }) {
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ colaboradorId = null, dataInicio, dataFim }) {
    const agendamentos = await this.agendamentoRepository.findParaEquipa({
      colaboradorId,
      dataInicio,
      dataFim,
    });

    return agendamentos.map((a) => {
      const dataStr = a.data.toISOString().slice(0, 10);
      return {
        id: a.id,
        title: `${a.servico.titulo} — ${a.cliente.nome}`,
        start: `${dataStr}T${a.horaInicio}:00`,
        end: `${dataStr}T${a.horaFim}:00`,
        extendedProps: {
          grupoId: a.grupoId,
          clienteNome: a.cliente.nome,
          clienteTelefone: a.cliente.telefone,
          clienteEmail: a.cliente.email,
          servicoTitulo: a.servico.titulo,
          servicoPreco: a.servico.preco,
          duracaoMinutos: a.servico.duracaoMinutos,
          colaboradorId: a.colaboradorId,
          colaboradorNome: a.colaborador.nome,
          valor: a.valor,
          pago: a.pago,
          metodoPagamento: a.metodoPagamento,
          observacoes: a.observacoes,
          status: a.status,
        },
      };
    });
  }
}
