export class Colaborador {
  constructor({
    id,
    salaoId,
    nome,
    email,
    passwordHash,
    ativo = true,
    googleRefreshToken = null,
    icsToken = null,
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
    this.googleRefreshToken = googleRefreshToken;
    this.icsToken = icsToken;
    this.createdAt = createdAt;
    this.servicos = servicos;
    this.horarios = horarios;
  }

  isGoogleCalendarConectado() {
    return Boolean(this.googleRefreshToken);
  }
}
