import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { GoogleCalendarGateway } from "@/infrastructure/gateways/GoogleCalendarGateway";

const colaboradorRepo = new PostgresColaboradorRepository();
const calendarGateway = new GoogleCalendarGateway();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  try {
    let colaborador = await colaboradorRepo.findById(session.user.id);
    let icsToken = colaborador?.icsToken;

    if (!icsToken) {
      icsToken = crypto.randomBytes(24).toString("base64url");
      colaborador = await colaboradorRepo.update(session.user.id, { icsToken });
    }

    const icsUrl = new URL(`/api/calendario/${session.user.id}/${icsToken}.ics`, req.url).toString();

    return NextResponse.json({
      nome: colaborador.nome,
      email: colaborador.email,
      googleConectado: Boolean(colaborador.googleRefreshToken),
      googleDisponivel: calendarGateway.isConfigurado(),
      icsUrl,
    });
  } catch (err) {
    return HttpResponse.tratarErro(err);
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  try {
    await colaboradorRepo.update(session.user.id, { googleRefreshToken: null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return HttpResponse.tratarErro(err);
  }
}
