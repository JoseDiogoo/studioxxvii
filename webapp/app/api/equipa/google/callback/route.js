import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { GoogleCalendarGateway } from "@/infrastructure/gateways/GoogleCalendarGateway";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";

const gateway = new GoogleCalendarGateway();
const colaboradorRepo = new PostgresColaboradorRepository();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/equipa/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";
  const colaboradorIdDoState = state.split(".")[0];

  if (!code || colaboradorIdDoState !== session.user.id) {
    return NextResponse.redirect(new URL("/equipa/definicoes?google=erro", req.url));
  }

  try {
    const refreshToken = await gateway.trocarCodigoPorRefreshToken(code);
    await colaboradorRepo.update(session.user.id, { googleRefreshToken: refreshToken });
  } catch (err) {
    console.error("[google-calendar] Falha no callback OAuth:", err);
    return NextResponse.redirect(new URL("/equipa/definicoes?google=erro", req.url));
  }

  return NextResponse.redirect(new URL("/equipa/definicoes?google=ligado", req.url));
}
