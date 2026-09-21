export class DateUtil {
  static parseDateOnly(str) {
    if (!str || typeof str !== "string") throw new Error("Data inválida.");
    const [y, m, d] = str.split("-").map(Number);
    if (!y || !m || !d) throw new Error("Formato de data inválido. Usa YYYY-MM-DD.");
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }

  static formatDateOnly(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  static inicioFimDoDiaUTC(date) {
    const d = date instanceof Date ? date : new Date(date);
    const inicio = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { inicio, fim };
  }
}
