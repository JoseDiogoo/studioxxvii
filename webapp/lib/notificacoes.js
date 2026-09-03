// Envio de WhatsApp ao cliente (via Twilio) quando uma marcação é criada, reagendada
// ou cancelada. Falha a enviar não deve reverter a alteração já feita — só regista o aviso.

function normalizarTelefonePT(telefone) {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.startsWith("351") && digitos.length > 9) return `+${digitos}`;
  return `+351${digitos.slice(-9)}`;
}

export function notificacoesAtivas() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM
  );
}

export async function enviarWhatsApp({ telefone, mensagem }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // ex: "whatsapp:+14155238886"

  if (!sid || !token || !from) {
    console.warn("[notificacoes] Twilio não configurado — mensagem não enviada:", mensagem);
    return { enviado: false };
  }

  try {
    const corpo = new URLSearchParams({
      From: from,
      To: `whatsapp:${normalizarTelefonePT(telefone)}`,
      Body: mensagem,
    });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
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

export function mensagemConfirmacao({ nomeCliente, servicoTitulo, dataStr, horaInicio }) {
  return `Olá ${nomeCliente}! A tua marcação de ${servicoTitulo} na Studio XXVII para ${dataStr} às ${horaInicio} está confirmada. Até já!`;
}

export function mensagemReagendamento({ nomeCliente, servicoTitulo, dataStr, horaInicio }) {
  return `Olá ${nomeCliente}, a Studio XXVII teve de reagendar a tua marcação de ${servicoTitulo}. Novo horário: ${dataStr} às ${horaInicio}. Se não te convier, responde a esta mensagem para combinarmos outra data.`;
}

export function mensagemCancelamento({ nomeCliente, servicoTitulo, dataStr, horaInicio }) {
  return `Olá ${nomeCliente}, a tua marcação de ${servicoTitulo} do dia ${dataStr} às ${horaInicio} na Studio XXVII foi cancelada. Contacta-nos para reagendar.`;
}
