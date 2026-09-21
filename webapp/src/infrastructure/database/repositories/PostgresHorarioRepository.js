import { IHorarioRepository } from "@/domain/repositories/IHorarioRepository";
import { Horario } from "@/domain/entities/Horario";
import { postgresDb } from "../postgres";

export class PostgresHorarioRepository extends IHorarioRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Horario({
      id: item.id,
      salaoId: item.salaoId,
      colaboradorId: item.colaboradorId,
      diaSemana: item.diaSemana,
      inicio: item.inicio,
      fim: item.fim,
    });
  }

  async findByColaboradoresEDiaSemana(colaboradorIds, diaSemana) {
    const itens = await this.db.horario.findMany({
      where: {
        colaboradorId: { in: colaboradorIds },
        diaSemana,
      },
    });
    return itens.map((i) => this._paraEntidade(i));
  }

  async findByColaboradorId(colaboradorId) {
    const itens = await this.db.horario.findMany({
      where: { colaboradorId },
      orderBy: { diaSemana: "asc" },
    });
    return itens.map((i) => this._paraEntidade(i));
  }
}
