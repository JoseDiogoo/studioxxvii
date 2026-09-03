import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const colaboradorId = searchParams.get("colaboradorId");

  if (!inicio || !fim) {
    return NextResponse.json({ error: "Falta o intervalo de datas." }, { status: 400 });
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      data: { gte: new Date(inicio), lte: new Date(fim) },
      ...(colaboradorId ? { colaboradorId } : {}),
    },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      servico: { select: { titulo: true, preco: true } },
      colaborador: { select: { id: true, nome: true } },
    },
    orderBy: { data: "asc" },
  });

  return NextResponse.json({ agendamentos });
}
