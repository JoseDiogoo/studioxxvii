import { prisma } from "@/lib/prisma";

// Feed iCalendar só de leitura, protegido por um token secreto (não por login),
// para o colaborador subscrever em "Adicionar calendário > A partir de um URL"
// no Google Calendar/Apple Calendar/Outlook e ver as marcações no telemóvel.
// Atualização não é instantânea (o Google só volta a pedir o feed periodicamente).

function escaparICS(texto) {
  return String(texto).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

function formatarICSData(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${mo}${d}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
}

function formatarICSTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(req, { params }) {
  const { colaboradorId, token: tokenComExtensao } = await params;
  const token = tokenComExtensao.replace(/\.ics$/, "");

  const colaborador = await prisma.colaborador.findUnique({ where: { id: colaboradorId } });
  if (!colaborador || !colaborador.icsToken || colaborador.icsToken !== token) {
    return new Response("Não encontrado.", { status: 404 });
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      colaboradorId,
      status: { not: "CANCELADO" },
      data: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
    },
    include: { cliente: true, servico: true },
    orderBy: { data: "asc" },
  });

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Studio XXVII//Marcacoes//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Studio XXVII - ${escaparICS(colaborador.nome)}`,
  ];

  for (const a of agendamentos) {
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${a.id}@studioxxvii.pt`,
      `DTSTAMP:${formatarICSTimestamp(new Date())}`,
      `DTSTART;TZID=Europe/Lisbon:${formatarICSData(a.data, a.horaInicio)}`,
      `DTEND;TZID=Europe/Lisbon:${formatarICSData(a.data, a.horaFim)}`,
      `SUMMARY:${escaparICS(`${a.servico.titulo} - ${a.cliente.nome}`)}`,
      `DESCRIPTION:${escaparICS(`Telefone: ${a.cliente.telefone}`)}`,
      "END:VEVENT"
    );
  }
  linhas.push("END:VCALENDAR");

  return new Response(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="studioxxvii.ics"',
      "Cache-Control": "no-store",
    },
  });
}
