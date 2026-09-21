import { RegraNegocioError } from "../errors/DomainError";

export class Servico {
  constructor({
    id,
    salaoId,
    titulo,
    descricao = null,
    preco,
    duracaoMinutos,
    ativo = true,
    createdAt = new Date(),
  }) {
    if (!titulo || typeof titulo !== "string") {
      throw new RegraNegocioError("O título do serviço é obrigatório.");
    }
    if (typeof preco !== "number" || preco < 0) {
      throw new RegraNegocioError("O preço do serviço deve ser um valor numérico não negativo.");
    }
    if (typeof duracaoMinutos !== "number" || duracaoMinutos <= 0) {
      throw new RegraNegocioError("A duração do serviço deve ser maior que zero.");
    }

    this.id = id;
    this.salaoId = salaoId;
    this.titulo = titulo;
    this.descricao = descricao;
    this.preco = preco;
    this.duracaoMinutos = duracaoMinutos;
    this.ativo = Boolean(ativo);
    this.createdAt = createdAt;
  }
}
