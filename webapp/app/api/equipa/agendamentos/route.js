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

  const dia = /^\d{4}-\d{2}-\d{2}$/;
  if (!inicio || !fim || !dia.test(inicio) || !dia.test(fim)) {
    return HttpResponse.badRequest("Intervalo de datas inválido.");
  }
  const dias = (new Date(`${fim}T00:00:00Z`) - new Date(`${inicio}T00:00:00Z`)) / 86_400_000;
  if (!(dias >= 0 && dias <= 62)) {
    return HttpResponse.badRequest("O intervalo pode ter no máximo 62 dias.");
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
