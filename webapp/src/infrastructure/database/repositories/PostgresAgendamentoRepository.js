import { IAgendamentoRepository } from "@/domain/repositories/IAgendamentoRepository";
import { Agendamento } from "@/domain/entities/Agendamento";
import { postgresDb } from "../postgres";

const INCLUDE_PADRAO = {
  cliente: { select: { id: true, nome: true, telefone: true, email: true } },
  servico: { select: { id: true, titulo: true, preco: true, duracaoMinutos: true } },
  colaborador: { select: { id: true, nome: true } },
};

export class PostgresAgendamentoRepository extends IAgendamentoRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Agendamento({
      id: item.id,
      grupoId: item.grupoId,
      clienteId: item.clienteId,
      colaboradorId: item.colaboradorId,
      servicoId: item.servicoId,
      data: item.data,
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      valor: item.valor,
      pago: item.pago,
      metodoPagamento: item.metodoPagamento,
      observacoes: item.observacoes,
      status: item.status,
      googleEventId: item.googleEventId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      cliente: item.cliente,
      colaborador: item.colaborador,
      servico: item.servico,
    });
  }

  async findById(id) {
    const item = await this.db.agendamento.findUnique({
      where: { id },
      include: INCLUDE_PADRAO,
    });
    return this._paraEntidade(item);
  }

  async findByGrupoId(grupoId) {
    const itens = await this.db.agendamento.findMany({
      where: { grupoId },
      include: INCLUDE_PADRAO,
      orderBy: { horaInicio: "asc" },
    });
    return itens.map((i) => this._paraEntidade(i));
  }

  async findByColaboradoresEData(colaboradorIds, inicioDia, fimDia) {
    const itens = await this.db.agendamento.findMany({
      where: {
        colaboradorId: { in: colaboradorIds },
        data: {
          gte: new Date(Date.UTC(inicioDia.getUTCFullYear(), inicioDia.getUTCMonth(), inicioDia.getUTCDate(), 0, 0, 0, 0)),
          lte: new Date(Date.UTC(fimDia.getUTCFullYear(), fimDia.getUTCMonth(), fimDia.getUTCDate(), 23, 59, 59, 999)),
        },
        status: { not: "CANCELADO" },
      },
      include: INCLUDE_PADRAO,
    });
    return itens.map((i) => this._paraEntidade(i));
  }

  async findParaEquipa({ colaboradorId, dataInicio, dataFim }) {
    const where = {};
    if (colaboradorId) where.colaboradorId = colaboradorId;

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const itens = await this.db.agendamento.findMany({
      where,
      include: INCLUDE_PADRAO,
      orderBy: [{ data: "asc" }, { horaInicio: "asc" }],
    });

    return itens.map((i) => this._paraEntidade(i));
  }

  async findHistorico({ colaboradorId, skip = 0, take = 50 }) {
    const where = {};
    if (colaboradorId) where.colaboradorId = colaboradorId;

    const [itens, total] = await Promise.all([
      this.db.agendamento.findMany({
        where,
        include: INCLUDE_PADRAO,
        orderBy: [{ data: "desc" }, { horaInicio: "desc" }],
        skip,
        take,
      }),
      this.db.agendamento.count({ where }),
    ]);

    return {
      agendamentos: itens.map((i) => this._paraEntidade(i)),
      total,
      skip,
      take,
    };
  }

  async criarAgendamentosEmTransacao({ clienteData, agendamentosData, salaoId, dia }) {
    return await this.db.$transaction(async (tx) => {
      const clienteDb = await tx.cliente.upsert({
        where: { salaoId_telefone: { salaoId, telefone: clienteData.telefone } },
        update: {
          nome: clienteData.nome,
          email: clienteData.email || null,
          observacoes: clienteData.observacoes || null,
        },
        create: {
          salaoId,
          nome: clienteData.nome,
          telefone: clienteData.telefone,
          email: clienteData.email || null,
          observacoes: clienteData.observacoes || null,
        },
      });

      const agendamentos = [];
      for (const item of agendamentosData) {
        const agendamento = await tx.agendamento.create({
          data: {
            grupoId: item.grupoId,
            clienteId: clienteDb.id,
            colaboradorId: item.colaboradorId,
            servicoId: item.servicoId,
            data: dia,
            horaInicio: item.horaInicio,
            horaFim: item.horaFim,
            valor: item.valor,
          },
          include: INCLUDE_PADRAO,
        });
        agendamentos.push(this._paraEntidade(agendamento));
      }

      return { cliente: clienteDb, agendamentos };
    });
  }

  async update(id, dados) {
    const item = await this.db.agendamento.update({
      where: { id },
      data: dados,
      include: INCLUDE_PADRAO,
    });
    return this._paraEntidade(item);
  }

  async delete(id) {
    await this.db.agendamento.delete({ where: { id } });
    return true;
  }

  async obterEstatisticas({ colaboradorId, dataInicio, dataFim }) {
    const where = { status: { not: "CANCELADO" } };
    if (colaboradorId) where.colaboradorId = colaboradorId;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const agendamentos = await this.db.agendamento.findMany({
      where,
      include: INCLUDE_PADRAO,
    });

    const totalCortes = agendamentos.length;
    const faturacaoTotal = agendamentos.reduce((acc, a) => acc + (a.pago ? a.valor : 0), 0);
    const pendenteFaturacao = agendamentos.reduce((acc, a) => acc + (!a.pago ? a.valor : 0), 0);

    return {
      totalCortes,
      faturacaoTotal,
      pendenteFaturacao,
      agendamentos: agendamentos.map((i) => this._paraEntidade(i)),
    };
  }
}
