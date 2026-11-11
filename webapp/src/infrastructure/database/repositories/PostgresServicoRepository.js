import { IServicoRepository } from "@/domain/repositories/IServicoRepository";
import { Servico } from "@/domain/entities/Servico";
import { postgresDb } from "../postgres";

export class PostgresServicoRepository extends IServicoRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Servico({
      id: item.id,
      salaoId: item.salaoId,
      titulo: item.titulo,
      descricao: item.descricao,
      preco: Number(item.preco),
      duracaoMinutos: item.duracaoMinutos,
      ativo: item.ativo,
      createdAt: item.createdAt,
    });
  }

  async findById(id) {
    const item = await this.db.servico.findUnique({ where: { id } });
    return this._paraEntidade(item);
  }

  async findByIds(ids) {
    const itens = await this.db.servico.findMany({
      where: { id: { in: ids }, ativo: true },
    });
    return itens.map((i) => this._paraEntidade(i));
  }

  async findAtivos() {
    const itens = await this.db.servico.findMany({
      where: { ativo: true },
      orderBy: { preco: "asc" },
    });
    return itens.map((i) => this._paraEntidade(i));
  }
}
