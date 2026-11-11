import { INotificationGateway } from "@/application/ports/INotificationGateway";
import { Telefone } from "@/domain/value-objects/Telefone";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Email no estilo do site: noir, creme e dourado como pontuação. Tabelas + estilos inline (único que os clientes de email suportam).
// Desenhado já em escuro para o modo escuro dos clientes de email não o "inverter" e estragar as cores.
const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function emailNovaMarcacao({ nomeCliente, telefoneCliente, servicoTitulo, dataStr, horaInicio }) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const diaSemana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  const sans = "Inter,-apple-system,'Segoe UI',Arial,sans-serif";
  const serif = "'Playfair Display',Georgia,'Times New Roman',serif";
  const linha = (rotulo, valor) =>
    `<tr><td style="padding:16px 0;border-top:1px solid #4a4235"><div style="font:700 10px ${sans};letter-spacing:3px;text-transform:uppercase;color:#c9a35f">${rotulo}</div>` +
    `<div style="font:400 17px ${sans};color:#ffffff;margin-top:6px">${valor}</div></td></tr>`;
  const tel = esc(telefoneCliente);
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<style>a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}u+#body a{color:inherit;text-decoration:none}</style></head>
<body id="body" style="margin:0;padding:0;background:#000000;background-image:linear-gradient(#000000,#000000)" bgcolor="#000000">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000;background-image:linear-gradient(#000000,#000000)"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="max-width:480px;background:#000000;background-image:linear-gradient(#000000,#000000);border-radius:20px;border:1px solid #4a4235">
<tr><td align="center" style="padding:36px 24px 8px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="76" height="76" style="width:76px;height:76px;border:1px solid #c9a35f;border-radius:50%;font:700 17px ${serif};letter-spacing:2px;color:#c9a35f">XXVII</td></tr></table>
<div style="font:700 10px ${sans};letter-spacing:5px;text-transform:uppercase;color:#c9a35f;margin-top:18px">Studio XXVII</div></td></tr>
<tr><td align="center" style="padding:24px 28px 4px">
<div style="font:700 11px ${sans};letter-spacing:3px;text-transform:uppercase;color:#d8cfbd">Nova marcação</div>
<div style="font:700 34px/1.15 ${serif};color:#ffffff;margin-top:10px">${esc(horaInicio).replace(':', ':&#8203;')}</div>
<div style="font:italic 400 18px ${serif};color:#c9a35f;margin-top:6px"><span style="text-decoration:none;color:#c9a35f">${esc(diaSemana)},&#8203; ${dia}&#8203; de ${esc(MESES[mes - 1])}</span></div></td></tr>
<tr><td style="padding:24px 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${linha("Cliente", esc(nomeCliente))}${linha("Serviço", esc(servicoTitulo))}${linha("Telefone", tel)}
</table></td></tr>
<tr><td align="center" style="padding:12px 32px 36px"><a href="tel:${tel}" style="display:inline-block;background:#c9a35f;background-image:linear-gradient(#c9a35f,#c9a35f);color:#000000;font:700 14px ${sans};text-decoration:none;padding:14px 32px;border-radius:999px">Ligar ao cliente</a></td></tr>
</table>
<div style="font:400 11px ${sans};color:#a89b83;margin-top:18px">Aviso automático · Studio XXVII, Alcobaça</div>
</td></tr></table></body></html>`;
}

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
      console.warn("[notificacoes] Twilio não configurado — mensagem não enviada.");
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

  async enviarNovaMarcacaoBarbeiro({ nomeCliente, telefoneCliente, servicoTitulo, dataStr, horaInicio }) {
    // Email via Resend. shortcut: remetente onboarding@resend.dev só envia para o email da conta Resend; trocar por endereço do domínio quando existir.
    const destino = process.env.BARBER_EMAIL;
    const apikey = process.env.RESEND_API_KEY;
    if (!destino || !apikey) return { enviado: false };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apikey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Studio XXVII <onboarding@resend.dev>",
          to: destino,
          subject: `Nova marcação: ${dataStr} às ${horaInicio}`,
          html: emailNovaMarcacao({ nomeCliente, telefoneCliente, servicoTitulo, dataStr, horaInicio }),
          text: `Cliente: ${nomeCliente}\nTelefone: ${telefoneCliente}\nServiço: ${servicoTitulo}\nData: ${dataStr} às ${horaInicio}`,
        }),
      });
      if (!res.ok) console.error("[notificacoes] Resend falhou:", await res.text().catch(() => res.status));
      return { enviado: res.ok };
    } catch (err) {
      console.error("[notificacoes] Erro Resend:", err);
      return { enviado: false };
    }
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
