export class Salao {
  constructor({
    id,
    nome,
    morada,
    telefone = null,
    createdAt = new Date(),
  }) {
    this.id = id;
    this.nome = nome;
    this.morada = morada;
    this.telefone = telefone;
    this.createdAt = createdAt;
  }
}
