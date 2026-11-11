export class TimezoneUtil {
  static agoraEmPortugal() {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

    const parts = fmt.formatToParts(new Date());
    const get = (tipo) => parts.find((p) => p.type === tipo)?.value;

    const y = get("year");
    const m = get("month");
    const d = get("day");
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));

    return {
      dataStr: `${y}-${m}-${d}`,
      minutos: hour * 60 + minute,
    };
  }
}
