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
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  const colaboradorId = searchParams.get("colaboradorId");
  const servicoId = searchParams.get("servicoId");
  const pago = searchParams.get("pago");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10) || 30));

  const where = {
    ...(de ? { data: { gte: new Date(`${de}T00:00:00`) } } : {}),
    ...(ate ? { data: { ...(de ? { gte: new Date(`${de}T00:00:00`) } : {}), lte: new Date(`${ate}T23:59:59`) } } : {}),
    ...(colaboradorId ? { colaboradorId } : {}),
    ...(servicoId ? { servicoId } : {}),
    ...(pago === "true" ? { pago: true } : {}),
    ...(pago === "false" ? { pago: false } : {}),
    ...(q ? { cliente: { nome: { contains: q } } } : {}),
  };

  const [total, agendamentos] = await Promise.all([
    prisma.agendamento.count({ where }),
    prisma.agendamento.findMany({
      where,
      include: {
        cliente: { select: { nome: true, telefone: true } },
        servico: { select: { titulo: true } },
        colaborador: { select: { nome: true } },
      },
      orderBy: [{ data: "desc" }, { horaInicio: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, agendamentos });
}
