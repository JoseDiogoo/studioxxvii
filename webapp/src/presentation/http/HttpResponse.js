import { NextResponse } from "next/server";
import { DomainError, SlotIndisponivelError, EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";

export class HttpResponse {
  static ok(data, init) {
    return NextResponse.json(data, { status: 200, ...init });
  }

  static created(data, init) {
    return NextResponse.json(data, { status: 201, ...init });
  }

  static badRequest(message = "Dados inválidos.") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  static unauthorized(message = "Não autorizado.") {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  static forbidden(message = "Acesso interdito.") {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  static notFound(message = "Recurso não encontrado.") {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  static conflict(message = "Conflito na operação.") {
    return NextResponse.json({ error: message }, { status: 409 });
  }

  static tooManyRequests(message = "Demasiados pedidos. Tenta novamente daqui a uns minutos.") {
    return NextResponse.json({ error: message }, { status: 429 });
  }

  static serverError(message = "Ocorreu um erro interno no servidor.") {
    return NextResponse.json({ error: message }, { status: 500 });
  }

  static tratarErro(err) {
    console.error("[API Error]:", err);

    if (err instanceof SlotIndisponivelError) {
      return this.conflict(err.message);
    }
    if (err instanceof EntidadeNaoEncontradaError) {
      return this.notFound(err.message);
    }
    if (err instanceof DomainError) {
      return this.badRequest(err.message);
    }
    return this.serverError(err?.message || "Erro inesperado.");
  }
}
