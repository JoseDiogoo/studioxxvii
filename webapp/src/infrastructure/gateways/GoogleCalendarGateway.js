import { ICalendarGateway } from "@/application/ports/ICalendarGateway";
import { postgresDb } from "../database/postgres";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarGateway extends ICalendarGateway {
  constructor(db = postgresDb) {
    super();
    this.db = db;
  }

  isConfigurado() {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  obterAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: state || "",
    });
    return `${AUTH_URL}?${params}`;
  }

  async trocarCodigoPorRefreshToken(code) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
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

  async _obterAccessToken(refreshToken) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
      }),
    }).catch(() => null);

    if (!res?.ok) return null;
    const data = await res.json();
    return data.access_token;
  }

  _eventoDoAgendamento(agendamento) {
    const dataStr = agendamento.data instanceof Date
      ? agendamento.data.toISOString().slice(0, 10)
      : String(agendamento.data).slice(0, 10);

    const tituloServico = agendamento.servico?.titulo || "Corte";
    const nomeCliente = agendamento.cliente?.nome || "Cliente";
    const telefoneCliente = agendamento.cliente?.telefone || "";

    return {
      summary: `${tituloServico} — ${nomeCliente}`,
      description: `Telefone: ${telefoneCliente}${agendamento.observacoes ? `\n${agendamento.observacoes}` : ""}`,
      start: { dateTime: `${dataStr}T${agendamento.horaInicio}:00`, timeZone: "Europe/Lisbon" },
      end: { dateTime: `${dataStr}T${agendamento.horaFim}:00`, timeZone: "Europe/Lisbon" },
    };
  }

  async sincronizarEvento(agendamento) {
    if (!this.isConfigurado()) return;

    try {
      const colaborador = await this.db.colaborador.findUnique({
        where: { id: agendamento.colaboradorId },
      });
      if (!colaborador?.googleRefreshToken) return;

      const accessToken = await this._obterAccessToken(colaborador.googleRefreshToken);
      if (!accessToken) return;

      const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
      const corpo = JSON.stringify(this._eventoDoAgendamento(agendamento));

      const criarEvento = async () => {
        const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
          method: "POST",
          headers,
          body: corpo,
        });
        if (res.ok) {
          const criado = await res.json();
          await this.db.agendamento.update({
            where: { id: agendamento.id },
            data: { googleEventId: criado.id },
          });
        }
      };

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

  async removerEvento(agendamento) {
    if (!this.isConfigurado() || !agendamento.googleEventId) return;

    try {
      const colaborador = await this.db.colaborador.findUnique({
        where: { id: agendamento.colaboradorId },
      });
      if (!colaborador?.googleRefreshToken) return;

      const accessToken = await this._obterAccessToken(colaborador.googleRefreshToken);
      if (!accessToken) return;

      await fetch(`${CALENDAR_API}/calendars/primary/events/${agendamento.googleEventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error("[google-calendar] Falha ao remover evento:", err);
    }
  }
}
