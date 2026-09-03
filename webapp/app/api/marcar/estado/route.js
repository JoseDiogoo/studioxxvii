import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Consultado pelo browser do cliente (polling) enquanto aguarda a confirmação do
// pagamento MB Way, que chega de forma assíncrona via webhook do ifthenpay.
export async function GET(req) {
  const grupoId = req.nextUrl.searchParams.get("grupoId");
  if (!grupoId) {
    return NextResponse.json({ error: "Falta o grupoId." }, { status: 400 });
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: { grupoId },
    select: { status: true },
  });

  if (agendamentos.length === 0) {
    return NextResponse.json({ error: "Marcação não encontrada." }, { status: 404 });
  }

  const status = agendamentos[0].status;
  return NextResponse.json({
    status,
    confirmado: status === "CONFIRMADO",
    cancelado: status === "CANCELADO",
  });
}
