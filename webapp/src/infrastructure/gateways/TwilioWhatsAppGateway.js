import { INotificationGateway } from "@/application/ports/INotificationGateway";
import { Telefone } from "@/domain/value-objects/Telefone";

export class TwilioWhatsAppGateway extends INotificationGateway {
  constructor() {
    super();
    this.sid = process.env.TWILIO_ACCOUNT_SID;
    this.token = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_WHATSAPP_FROM;
  }

  isConfigurado() {
    return Boolean(this.sid && this.token && this.from);
  }

  async _enviar(telefone, mensagem) {
    if (!this.isConfigurado()) {
      console.warn("[notificacoes] Twilio não configurado — mensagem não enviada:", mensagem);
      return { enviado: false };
    }

    try {
      const numeroNormalizado = Telefone.normalizarPT(telefone);
      const corpo = new URLSearchParams({
        From: this.from,
        To: `whatsapp:${numeroNormalizado}`,
        Body: mensagem,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.sid}:${this.token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: corpo,
      });

      if (!res.ok) {
        console.error("[notificacoes] Falha ao enviar WhatsApp:", await res.text().catch(() => res.statusText));
        return { enviado: false };
      }
      return { enviado: true };
    } catch (err) {
      console.error("[notificacoes] Erro ao enviar WhatsApp:", err);
      return { enviado: false };
    }
  }

  async enviarConfirmacao({ telefone, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    const mensagem = `Olá ${nomeCliente}! A tua marcação de ${servicoTitulo} na Studio XXVII para ${dataStr} às ${horaInicio} está confirmada. Até já!`;
    return await this._enviar(telefone, mensagem);
  }

  async enviarReagendamento({ telefone, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    const mensagem = `Olá ${nomeCliente}, a Studio XXVII teve de reagendar a tua marcação de ${servicoTitulo}. Novo horário: ${dataStr} às ${horaInicio}. Se não te convier, responde a esta mensagem para combinarmos outra data.`;
    return await this._enviar(telefone, mensagem);
  }

  async enviarCancelamento({ telefone, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    const mensagem = `Olá ${nomeCliente}, a tua marcação de ${servicoTitulo} do dia ${dataStr} às ${horaInicio} na Studio XXVII foi cancelada. Contacta-nos para reagendar.`;
    return await this._enviar(telefone, mensagem);
  }
}
