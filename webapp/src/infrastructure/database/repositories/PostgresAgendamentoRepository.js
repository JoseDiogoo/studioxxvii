import { IAgendamentoRepository } from "@/domain/repositories/IAgendamentoRepository";
import { Agendamento } from "@/domain/entities/Agendamento";
import { SlotIndisponivelError, RegraNegocioError } from "@/domain/errors/DomainError";
import { postgresDb } from "../postgres";

const INCLUDE_PADRAO = {
  cliente: { select: { id: true, nome: true, telefone: true, email: true, observacoes: true } },
  servico: { select: { id: true, titulo: true, preco: true, duracaoMinutos: true } },
  colaborador: { select: { id: true, nome: true } },
};

function dataValida(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new RegraNegocioError("Data inválida.");
  return d;
}

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
      observacoes: item.observacoes,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      cliente: item.cliente,
      colaborador: item.colaborador,
      // Decimal do Prisma -> number (senão chega ao JSON como string).
      servico: item.servico && { ...item.servico, preco: Number(item.servico.preco) },
    });
  }

  async findById(id) {
    const item = await this.db.agendamento.findUnique({
      where: { id },
      include: INCLUDE_PADRAO,
    });
    return this._paraEntidade(item);
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

  async contarPendentesPorTelefone(telefone, hoje) {
    // Uma marcação com vários serviços tem uma linha por serviço (mesmo grupoId): conta-se uma vez.
    const grupos = await this.db.agendamento.findMany({
      where: {
        cliente: { telefone },
        status: "CONFIRMADO",
        data: { gte: new Date(`${hoje}T00:00:00.000Z`) },
      },
      distinct: ["grupoId"],
      select: { grupoId: true },
    });
    return grupos.length;
  }

  async findParaEquipa({ colaboradorId, dataInicio, dataFim }) {
    const where = {};
    if (colaboradorId) where.colaboradorId = colaboradorId;

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataValida(dataInicio);
      if (dataFim) where.data.lte = dataValida(dataFim);
    }

    const itens = await this.db.agendamento.findMany({
      where,
      include: INCLUDE_PADRAO,
      orderBy: [{ data: "asc" }, { horaInicio: "asc" }],
      take: 2000,
    });

    return itens.map((i) => this._paraEntidade(i));
  }

  async criarAgendamentosEmTransacao({ clienteData, agendamentosData, salaoId, dia }) {
    return await this.db.$transaction(async (tx) => {
      // Duas pessoas a marcar a mesma hora ao mesmo tempo: o lock obriga a segunda a esperar pela primeira
      // e a verificação a seguir apanha o conflito. Ordenado para evitar deadlocks entre marcações com vários serviços.
      const dataChave = dia.toISOString().slice(0, 10);
      const chaves = [...new Set(agendamentosData.map((i) => `${i.colaboradorId}:${dataChave}`))].sort();
      for (const chave of chaves) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${chave}::text))`;
      }

      for (const item of agendamentosData) {
        const conflito = await tx.agendamento.findFirst({
          where: {
            colaboradorId: item.colaboradorId,
            data: dia,
            status: { not: "CANCELADO" },
            horaInicio: { lt: item.horaFim },
            horaFim: { gt: item.horaInicio },
          },
          select: { id: true },
        });
        if (conflito) throw new SlotIndisponivelError();
      }

      const clienteDb = await tx.cliente.upsert({
        where: { salaoId_telefone: { salaoId, telefone: clienteData.telefone } },
        // Cliente existente (mesmo telefone) não é alterado: o telefone não é verificado, por isso quem
        // marca não pode reescrever o nome/email guardados. As observações ficam só nesta marcação.
        update: {},
        create: {
          salaoId,
          nome: clienteData.nome,
          telefone: clienteData.telefone,
          email: clienteData.email || null,
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
            observacoes: clienteData.observacoes || null,
          },
          include: INCLUDE_PADRAO,
        });
        agendamentos.push(this._paraEntidade(agendamento));
      }

      return { cliente: clienteDb, agendamentos };
    });
  }

  /** Move/reativa uma marcação: bloqueio + verificação de sobreposição + gravação na mesma transação. */
  async atualizarSemConflito(id, dados, { colaboradorId, data, horaInicio, horaFim }) {
    return await this.db.$transaction(async (tx) => {
      const chave = `${colaboradorId}:${new Date(data).toISOString().slice(0, 10)}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${chave}::text))`;

      const conflito = await tx.agendamento.findFirst({
        where: {
          id: { not: id },
          colaboradorId,
          data: new Date(data),
          status: { not: "CANCELADO" },
          horaInicio: { lt: horaFim },
          horaFim: { gt: horaInicio },
        },
        select: { id: true },
      });
      if (conflito) throw new SlotIndisponivelError();

      const item = await tx.agendamento.update({ where: { id }, data: dados, include: INCLUDE_PADRAO });
      return this._paraEntidade(item);
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
}
