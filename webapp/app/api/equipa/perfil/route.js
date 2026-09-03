import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { garantirIcsToken } from "@/lib/colaboradores";
import { googleCalendarConfigurado } from "@/lib/googleCalendar";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const colaborador = await prisma.colaborador.findUnique({ where: { id: session.user.id } });
  const icsToken = await garantirIcsToken(session.user.id);
  const icsUrl = new URL(`/api/calendario/${session.user.id}/${icsToken}.ics`, req.url).toString();

  return NextResponse.json({
    nome: colaborador.nome,
    email: colaborador.email,
    googleConectado: Boolean(colaborador.googleRefreshToken),
    googleDisponivel: googleCalendarConfigurado(),
    icsUrl,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  await prisma.colaborador.update({
    where: { id: session.user.id },
    data: { googleRefreshToken: null },
  });

  return NextResponse.json({ ok: true });
}
