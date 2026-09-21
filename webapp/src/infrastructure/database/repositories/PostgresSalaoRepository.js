import { ISalaoRepository } from "@/domain/repositories/ISalaoRepository";
import { Salao } from "@/domain/entities/Salao";
import { postgresDb } from "../postgres";

export class PostgresSalaoRepository extends ISalaoRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Salao({
      id: item.id,
      nome: item.nome,
      morada: item.morada,
      telefone: item.telefone,
      createdAt: item.createdAt,
    });
  }

  async getPrimeiroSalao() {
    let item = await this.db.salao.findFirst();
    if (!item) {
      item = await this.db.salao.create({
        data: {
          nome: "Studio XXVII",
          morada: "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça",
        },
      });
    }
    return this._paraEntidade(item);
  }

  async findById(id) {
    const item = await this.db.salao.findUnique({ where: { id } });
    return this._paraEntidade(item);
  }
}
