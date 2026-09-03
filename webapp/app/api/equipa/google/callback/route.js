import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trocarCodigoPorRefreshToken } from "@/lib/googleCalendar";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/equipa/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";
  const colaboradorIdDoState = state.split(".")[0];

  // O state tem de corresponder ao colaborador que iniciou o pedido, para evitar
  // que a conta Google de outra pessoa fique associada por engano/CSRF.
  if (!code || colaboradorIdDoState !== session.user.id) {
    return NextResponse.redirect(new URL("/equipa/definicoes?google=erro", req.url));
  }

  try {
    const refreshToken = await trocarCodigoPorRefreshToken(code);
    await prisma.colaborador.update({
      where: { id: session.user.id },
      data: { googleRefreshToken: refreshToken },
    });
  } catch (err) {
    console.error("[google-calendar] Falha no callback OAuth:", err);
    return NextResponse.redirect(new URL("/equipa/definicoes?google=erro", req.url));
  }

  return NextResponse.redirect(new URL("/equipa/definicoes?google=ligado", req.url));
}
