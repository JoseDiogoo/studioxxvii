import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const salao = await prisma.salao.findFirst({
    select: { id: true, nome: true, morada: true, telefone: true },
  });
  if (!salao) {
    return NextResponse.json({ error: "Salão não configurado." }, { status: 404 });
  }
  return NextResponse.json(salao);
}
