export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = "DomainError";
  }
}

export class SlotIndisponivelError extends DomainError {
  constructor(message = "Esse horário deixou de estar disponível. Escolhe outro.") {
    super(message);
    this.name = "SlotIndisponivelError";
  }
}

export class EntidadeNaoEncontradaError extends DomainError {
  constructor(entidade, identificador = "") {
    super(`${entidade} não encontrado(a)${identificador ? `: ${identificador}` : ""}.`);
    this.name = "EntidadeNaoEncontradaError";
  }
}

export class RegraNegocioError extends DomainError {
  constructor(message) {
    super(message);
    this.name = "RegraNegocioError";
  }
}
