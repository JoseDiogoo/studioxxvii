export class HorarioSlot {
  static timeToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return 0;
    const [h, m] = hhmm.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  static minutesToTime(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  static isSobreposto(inicioA, fimA, inicioB, fimB) {
    const iA = typeof inicioA === "string" ? this.timeToMinutes(inicioA) : inicioA;
    const fA = typeof fimA === "string" ? this.timeToMinutes(fimA) : fimA;
    const iB = typeof inicioB === "string" ? this.timeToMinutes(inicioB) : inicioB;
    const fB = typeof fimB === "string" ? this.timeToMinutes(fimB) : fimB;

    return iA < fB && iB < fA;
  }
}
