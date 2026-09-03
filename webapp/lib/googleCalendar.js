// Sincronização one-way (app -> Google Calendar) dos agendamentos de cada colaborador,
// para aparecerem no telemóvel deles. A edição continua a ser sempre feita em /equipa;
// nunca lemos alterações feitas diretamente no Google, só escrevemos.

import { prisma } from "@/lib/prisma";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export function googleCalendarConfigurado() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

export function googleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

export async function trocarCodigoPorRefreshToken(code) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Falha ao trocar o código OAuth com a Google.");
  const data = await res.json();
  if (!data.refresh_token) {
    throw new Error("A Google não devolveu refresh_token (tenta desligar e voltar a ligar a conta).");
  }
  return data.refresh_token;
}

async function obterAccessToken(refreshToken) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const data = await res.json();
  return data.access_token;
}

function eventoDoAgendamento(agendamento) {
  const dataStr = agendamento.data.toISOString().slice(0, 10);
  return {
    summary: `${agendamento.servico.titulo} — ${agendamento.cliente.nome}`,
    description: `Telefone: ${agendamento.cliente.telefone}${agendamento.observacoes ? `\n${agendamento.observacoes}` : ""}`,
    start: { dateTime: `${dataStr}T${agendamento.horaInicio}:00`, timeZone: "Europe/Lisbon" },
    end: { dateTime: `${dataStr}T${agendamento.horaFim}:00`, timeZone: "Europe/Lisbon" },
  };
}

/** Cria/atualiza o evento no Google Calendar do colaborador dono do agendamento. Nunca lança — falhas ficam só em log. */
export async function sincronizarGoogleCalendar(agendamento) {
  if (!googleCalendarConfigurado()) return;

  try {
    const colaborador = await prisma.colaborador.findUnique({ where: { id: agendamento.colaboradorId } });
    if (!colaborador?.googleRefreshToken) return;

    const accessToken = await obterAccessToken(colaborador.googleRefreshToken);
    if (!accessToken) return;

    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
    const corpo = JSON.stringify(eventoDoAgendamento(agendamento));

    async function criarEvento() {
      const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, { method: "POST", headers, body: corpo });
      if (res.ok) {
        const criado = await res.json();
        await prisma.agendamento.update({ where: { id: agendamento.id }, data: { googleEventId: criado.id } });
      }
    }

    if (agendamento.googleEventId) {
      const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${agendamento.googleEventId}`, {
        method: "PATCH",
        headers,
        body: corpo,
      });
      if (res.status === 404) await criarEvento();
    } else {
      await criarEvento();
    }
  } catch (err) {
    console.error("[google-calendar] Falha ao sincronizar evento:", err);
  }
}

/** Remove o evento do Google Calendar quando o agendamento é cancelado. Nunca lança. */
export async function removerEventoGoogleCalendar(agendamento) {
  if (!googleCalendarConfigurado() || !agendamento.googleEventId) return;

  try {
    const colaborador = await prisma.colaborador.findUnique({ where: { id: agendamento.colaboradorId } });
    if (!colaborador?.googleRefreshToken) return;

    const accessToken = await obterAccessToken(colaborador.googleRefreshToken);
    if (!accessToken) return;

    await fetch(`${CALENDAR_API}/calendars/primary/events/${agendamento.googleEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error("[google-calendar] Falha ao remover evento:", err);
  }
}
