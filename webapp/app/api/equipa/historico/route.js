import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { postgresDb } from "@/infrastructure/database/postgres";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  const { searchParams } = req.nextUrl;
  const dataValida = (v) => v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
  const de = dataValida(searchParams.get("de")) ? searchParams.get("de") : null;
  const ate = dataValida(searchParams.get("ate")) ? searchParams.get("ate") : null;
  const colaboradorId = searchParams.get("colaboradorId")?.slice(0, 40) || null;
  const servicoId = searchParams.get("servicoId")?.slice(0, 40) || null;
  const pago = searchParams.get("pago");
  const q = searchParams.get("q")?.trim().slice(0, 100);
  const page = Math.min(1000, Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10) || 30));

  const where = {
    ...(de ? { data: { gte: new Date(`${de}T00:00:00`) } } : {}),
    ...(ate ? { data: { ...(de ? { gte: new Date(`${de}T00:00:00`) } : {}), lte: new Date(`${ate}T23:59:59`) } } : {}),
    ...(colaboradorId ? { colaboradorId } : {}),
    ...(servicoId ? { servicoId } : {}),
    ...(pago === "true" ? { pago: true } : {}),
    // "Por pagar" não inclui as canceladas (não há nada a cobrar).
    ...(pago === "false" ? { pago: false, status: { not: "CANCELADO" } } : {}),
    ...(q ? { cliente: { nome: { contains: q, mode: "insensitive" } } } : {}),
  };

  try {
    const [total, agendamentos] = await Promise.all([
      postgresDb.agendamento.count({ where }),
      postgresDb.agendamento.findMany({
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

    return NextResponse.json({
      total, page, pageSize,
      agendamentos: agendamentos.map((a) => ({ ...a, valor: Number(a.valor) })),
    });
  } catch (err) {
    return HttpResponse.tratarErro(err);
  }
}
