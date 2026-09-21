export class Horario {
  constructor({
    id,
    salaoId,
    colaboradorId,
    diaSemana,
    inicio,
    fim,
  }) {
    this.id = id;
    this.salaoId = salaoId;
    this.colaboradorId = colaboradorId;
    this.diaSemana = diaSemana; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    this.inicio = inicio;       // "10:00"
    this.fim = fim;             // "19:00"
  }
}
