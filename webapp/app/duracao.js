// 30 → "30 min", 45 → "45 min", 60 → "1h", 80 → "1h20", 90 → "1h30"
export function formatarDuracao(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
