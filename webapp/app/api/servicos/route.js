import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const servicos = await prisma.servico.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, titulo: true, descricao: true, preco: true, duracaoMinutos: true },
  });
  return NextResponse.json({ servicos });
}
