import { Telefone } from "../value-objects/Telefone";
import { RegraNegocioError } from "../errors/DomainError";

export class Cliente {
  constructor({
    id,
    salaoId,
    nome,
    telefone,
    email = null,
    observacoes = null,
    createdAt = new Date(),
  }) {
    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      throw new RegraNegocioError("O nome do cliente é obrigatório.");
    }
    if (!telefone) {
      throw new RegraNegocioError("O telefone do cliente é obrigatório.");
    }

    this.id = id;
    this.salaoId = salaoId;
    this.nome = nome.trim();
    this.telefone = Telefone.normalizarPT(telefone);
    this.email = email ? email.trim().toLowerCase() : null;
    this.observacoes = observacoes ? observacoes.trim() : null;
    this.createdAt = createdAt;
  }
}
