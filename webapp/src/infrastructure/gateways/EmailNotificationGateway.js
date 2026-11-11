import { INotificationGateway } from "@/application/ports/INotificationGateway";
import { log } from "@/infrastructure/logger";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MORADA = "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça";

/**
 * Email no estilo do site: noir, creme e dourado como pontuação. Tabelas + estilos inline (único que os clientes de email suportam).
 * Desenhado já em escuro para o modo escuro dos clientes de email não o "inverter" e estragar as cores.
 */
function emailHtml({ kicker, dataStr, horaInicio, linhas, nota, botao }) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const diaSemana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  const sans = "Inter,-apple-system,'Segoe UI',Arial,sans-serif";
  const serif = "'Playfair Display',Georgia,'Times New Roman',serif";
  const G = (c) => `background:${c};background-image:linear-gradient(${c},${c})`;
  const linha = ([rotulo, valor]) =>
    `<tr><td style="padding:16px 0;border-top:1px solid #4a4235"><div style="font:700 10px ${sans};letter-spacing:3px;text-transform:uppercase;color:#c9a35f">${rotulo}</div>` +
    `<div style="font:400 17px ${sans};color:#ffffff;margin-top:6px">${valor}</div></td></tr>`;
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<style>a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}u+#body a{color:inherit;text-decoration:none}</style></head>
<body id="body" style="margin:0;padding:0;${G("#000000")}" bgcolor="#000000">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="${G("#000000")}"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="max-width:480px;${G("#000000")};border-radius:20px;border:1px solid #4a4235">
<tr><td align="center" style="padding:36px 24px 8px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="76" height="76" style="width:76px;height:76px;border:1px solid #c9a35f;border-radius:50%;font:700 17px ${serif};letter-spacing:2px;color:#c9a35f">XXVII</td></tr></table>
<div style="font:700 10px ${sans};letter-spacing:5px;text-transform:uppercase;color:#c9a35f;margin-top:18px">Studio XXVII</div></td></tr>
<tr><td align="center" style="padding:24px 28px 4px">
<div style="font:700 11px ${sans};letter-spacing:3px;text-transform:uppercase;color:#d8cfbd">${esc(kicker)}</div>
<div style="font:700 34px/1.15 ${serif};color:#ffffff;margin-top:10px">${esc(horaInicio).replace(":", ":&#8203;")}</div>
<div style="font:italic 400 18px ${serif};color:#c9a35f;margin-top:6px"><span style="text-decoration:none;color:#c9a35f">${esc(diaSemana)},&#8203; ${dia}&#8203; de ${esc(MESES[mes - 1])}</span></div></td></tr>
<tr><td style="padding:24px 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${linhas.map(linha).join("")}
</table></td></tr>
${nota ? `<tr><td align="center" style="padding:8px 32px 8px;font:400 14px/1.6 ${sans};color:#d8cfbd">${esc(nota)}</td></tr>` : ""}
${botao ? `<tr><td align="center" style="padding:12px 32px 36px"><a href="${esc(botao.href)}" style="display:inline-block;${G("#c9a35f")};color:#000000;font:700 14px ${sans};text-decoration:none;padding:14px 32px;border-radius:999px">${esc(botao.texto)}</a></td></tr>` : `<tr><td style="padding:0 0 28px"></td></tr>`}
</table>
<div style="font:400 11px ${sans};color:#a89b83;margin-top:18px">Studio XXVII · ${esc(MORADA)}</div>
</td></tr></table></body></html>`;
}

export class EmailNotificationGateway extends INotificationGateway {
  /** shortcut: remetente onboarding@resend.dev só entrega ao email da conta Resend; definir EMAIL_FROM com domínio verificado para enviar a clientes. */
  async _enviar({ para, assunto, html, texto, contexto }) {
    const apikey = process.env.RESEND_API_KEY;
    if (!apikey || !para) {
      log("aviso", "email", "email NÃO enviado: falta RESEND_API_KEY ou destinatário", { contexto });
      return { enviado: false };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apikey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Studio XXVII <onboarding@resend.dev>",
          to: para,
          subject: assunto,
          html,
          text: texto,
        }),
      });
      if (!res.ok) {
        log("erro", "email", `Resend recusou o email (${contexto})`, { estado: res.status, resposta: (await res.text().catch(() => "")).slice(0, 300) });
        return { enviado: false };
      }
      log("info", "email", `email enviado (${contexto})`);
      return { enviado: true };
    } catch (err) {
      log("erro", "email", `falha de rede ao enviar email (${contexto})`, { mensagem: err?.message });
      return { enviado: false };
    }
  }

  _cliente({ email, nomeCliente, servicoTitulo, dataStr, horaInicio }, { kicker, assunto, nota, contexto }) {
    if (!email) {
      log("info", "email", `cliente sem email: ${contexto} não enviado`);
      return Promise.resolve({ enviado: false });
    }
    return this._enviar({
      para: email,
      assunto,
      contexto,
      html: emailHtml({ kicker, dataStr, horaInicio, nota, linhas: [["Nome", esc(nomeCliente)], ["Serviço", esc(servicoTitulo)], ["Onde", esc(MORADA)]] }),
      texto: `${assunto}\n${nomeCliente}, ${servicoTitulo}, ${dataStr} às ${horaInicio}.\n${MORADA}`,
    });
  }

  enviarConfirmacao(dados) {
    return this._cliente(dados, {
      kicker: "Marcação confirmada",
      assunto: `Marcação confirmada: ${dados.dataStr} às ${dados.horaInicio}`,
      nota: "Para cancelar ou alterar, fala connosco por Instagram ou WhatsApp. O pagamento é feito na barbearia.",
      contexto: "confirmação ao cliente",
    });
  }

  enviarReagendamento(dados) {
    return this._cliente(dados, {
      kicker: "Marcação reagendada",
      assunto: `Marcação reagendada: ${dados.dataStr} às ${dados.horaInicio}`,
      nota: "Tivemos de mudar a tua marcação. Se esta hora não te convier, fala connosco e combinamos outra.",
      contexto: "reagendamento ao cliente",
    });
  }

  enviarCancelamento(dados) {
    return this._cliente(dados, {
      kicker: "Marcação cancelada",
      assunto: `Marcação cancelada: ${dados.dataStr} às ${dados.horaInicio}`,
      nota: "A tua marcação foi cancelada. Podes marcar nova hora no nosso site quando quiseres.",
      contexto: "cancelamento ao cliente",
    });
  }

  enviarNovaMarcacaoBarbeiro({ nomeCliente, telefoneCliente, servicoTitulo, dataStr, horaInicio }) {
    const destino = process.env.BARBER_EMAIL;
    if (!destino) {
      log("aviso", "email", "aviso ao barbeiro NÃO enviado: falta BARBER_EMAIL");
      return Promise.resolve({ enviado: false });
    }
    return this._enviar({
      para: destino,
      assunto: `Nova marcação: ${dataStr} às ${horaInicio}`,
      contexto: "aviso ao barbeiro",
      html: emailHtml({
        kicker: "Nova marcação",
        dataStr,
        horaInicio,
        linhas: [["Cliente", esc(nomeCliente)], ["Serviço", esc(servicoTitulo)], ["Telefone", esc(telefoneCliente)]],
        botao: { href: `tel:${telefoneCliente}`, texto: "Ligar ao cliente" },
      }),
      texto: `Cliente: ${nomeCliente}\nTelefone: ${telefoneCliente}\nServiço: ${servicoTitulo}\nData: ${dataStr} às ${horaInicio}`,
    });
  }
}
