import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { HttpResponse } from "@/presentation/http/HttpResponse";

const repo = new PostgresAgendamentoRepository();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  const { searchParams } = req.nextUrl;
  const inicio = searchParams.get("inicio") || searchParams.get("start");
  const fim = searchParams.get("fim") || searchParams.get("end");
  const colaboradorId = searchParams.get("colaboradorId");

  if (!inicio || !fim) {
    return HttpResponse.badRequest("Falta o intervalo de datas.");
  }

  try {
    const agendamentos = await repo.findParaEquipa({
      colaboradorId,
      dataInicio: inicio,
      dataFim: fim,
    });
    return NextResponse.json({ agendamentos });
  } catch (err) {
    return HttpResponse.tratarErro(err);
  }
}
