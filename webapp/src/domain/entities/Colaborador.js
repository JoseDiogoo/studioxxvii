export class Colaborador {
  constructor({
    id,
    salaoId,
    nome,
    email,
    passwordHash,
    ativo = true,
    createdAt = new Date(),
    servicos = [],
    horarios = [],
  }) {
    this.id = id;
    this.salaoId = salaoId;
    this.nome = nome;
    this.email = email ? email.trim().toLowerCase() : "";
    this.passwordHash = passwordHash;
    this.ativo = Boolean(ativo);
    this.createdAt = createdAt;
    this.servicos = servicos;
    this.horarios = horarios;
  }
}
