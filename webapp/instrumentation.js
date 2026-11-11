// Corre uma vez quando o servidor arranca: fica no log o que está (e o que falta) configurado.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { log } = await import("@/infrastructure/logger");
  const ok = (v) => Boolean(v);
  log("info", "arranque", "servidor iniciado", {
    base_de_dados: ok(process.env.DATABASE_URL),
    email_resend: ok(process.env.RESEND_API_KEY),
    email_barbeiro: ok(process.env.BARBER_EMAIL),
    site_url: process.env.SITE_URL || null,
  });
  if (!process.env.RESEND_API_KEY || !process.env.BARBER_EMAIL) {
    log("aviso", "arranque", "sem RESEND_API_KEY/BARBER_EMAIL: o barbeiro NÃO recebe aviso de novas marcações");
  }
}
