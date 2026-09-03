// Datas "de calendário" (sem hora) são sempre ancoradas em UTC meia-noite,
// para não depender do fuso-horário onde o servidor está hospedado.

export function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function inicioFimDoDiaUTC(date) {
  const inicio = new Date(date);
  inicio.setUTCHours(0, 0, 0, 0);
  const fim = new Date(date);
  fim.setUTCHours(23, 59, 59, 999);
  return { inicio, fim };
}
