import { IColaboradorRepository } from "@/domain/repositories/IColaboradorRepository";
import { Colaborador } from "@/domain/entities/Colaborador";
import { postgresDb } from "../postgres";

export class PostgresColaboradorRepository extends IColaboradorRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Colaborador({
      id: item.id,
      salaoId: item.salaoId,
      nome: item.nome,
      email: item.email,
      passwordHash: item.passwordHash,
      ativo: item.ativo,
      googleRefreshToken: item.googleRefreshToken,
      icsToken: item.icsToken,
      createdAt: item.createdAt,
      servicos: item.servicos,
      horarios: item.horarios,
    });
  }

  async findById(id) {
    const item = await this.db.colaborador.findUnique({
      where: { id },
      include: {
        servicos: { select: { servicoId: true } },
        horarios: true,
      },
    });
    return this._paraEntidade(item);
  }

  async findByEmail(email) {
    const item = await this.db.colaborador.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return this._paraEntidade(item);
  }

  async findByIcsToken(icsToken) {
    const item = await this.db.colaborador.findUnique({
      where: { icsToken },
    });
    return this._paraEntidade(item);
  }

  async findAtivos() {
    const itens = await this.db.colaborador.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        servicos: { select: { servicoId: true } },
      },
      orderBy: { nome: "asc" },
    });
    return itens;
  }

  async findElegiveisPorServico(servicoId) {
    const rels = await this.db.colaboradorServico.findMany({
      where: { servicoId, colaborador: { ativo: true } },
      select: { colaboradorId: true, colaborador: { select: { id: true, nome: true } } },
    });
    return rels;
  }

  async update(id, dados) {
    const item = await this.db.colaborador.update({
      where: { id },
      data: dados,
    });
    return this._paraEntidade(item);
  }
}
