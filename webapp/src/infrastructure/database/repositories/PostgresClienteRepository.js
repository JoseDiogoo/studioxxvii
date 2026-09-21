import { IClienteRepository } from "@/domain/repositories/IClienteRepository";
import { Cliente } from "@/domain/entities/Cliente";
import { postgresDb } from "../postgres";

export class PostgresClienteRepository extends IClienteRepository {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  _paraEntidade(item) {
    if (!item) return null;
    return new Cliente({
      id: item.id,
      salaoId: item.salaoId,
      nome: item.nome,
      telefone: item.telefone,
      email: item.email,
      observacoes: item.observacoes,
      createdAt: item.createdAt,
    });
  }

  async findById(id) {
    const item = await this.db.cliente.findUnique({ where: { id } });
    return this._paraEntidade(item);
  }

  async findByTelefoneESalao(salaoId, telefone) {
    const item = await this.db.cliente.findUnique({
      where: { salaoId_telefone: { salaoId, telefone } },
    });
    return this._paraEntidade(item);
  }

  async upsertCliente({ salaoId, nome, telefone, email = null, observacoes = null }) {
    const item = await this.db.cliente.upsert({
      where: { salaoId_telefone: { salaoId, telefone } },
      update: {
        nome,
        email: email || null,
        observacoes: observacoes || null,
      },
      create: {
        salaoId,
        nome,
        telefone,
        email: email || null,
        observacoes: observacoes || null,
      },
    });
    return this._paraEntidade(item);
  }
}
