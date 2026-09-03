const TZ = "Europe/Lisbon";

/** Hora atual em Portugal, independente do fuso-horário do servidor. */
export function agoraEmPortugal() {
  const agora = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = Object.fromEntries(formatter.formatToParts(agora).map((p) => [p.type, p.value]));
  return {
    dataStr: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}
