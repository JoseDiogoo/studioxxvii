import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { googleAuthUrl, googleCalendarConfigurado } from "@/lib/googleCalendar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!googleCalendarConfigurado()) {
    return NextResponse.json({ error: "Integração com o Google Calendar não está configurada no servidor." }, { status: 503 });
  }

  const state = `${session.user.id}.${Date.now()}`;
  return NextResponse.redirect(googleAuthUrl(state));
}
