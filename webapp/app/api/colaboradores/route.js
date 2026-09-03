import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const servicoId = req.nextUrl.searchParams.get("servicoId");

  const colaboradores = await prisma.colaborador.findMany({
    where: {
      ativo: true,
      ...(servicoId ? { servicos: { some: { servicoId } } } : {}),
    },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json({ colaboradores });
}
