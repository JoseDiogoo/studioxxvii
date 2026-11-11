// Auditoria de responsividade/acessibilidade com emulação real de dispositivo (CDP), sem dependências.
// Uso: node scripts/audit-responsivo.mjs [baseUrl] [pastaSaida]
//   BROWSER=<caminho do chrome/msedge> (por omissão tenta Edge e Chrome no Windows)
//   AUDIT_EMAIL / AUDIT_PASSWORD (opcional): entra na área da equipa e audita /equipa e /equipa/historico
// Mede: scroll horizontal, alvos de toque < 44px, texto < 12px, controlos sem nome. Grava capturas em pastaSaida.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as esperar } from "node:timers/promises";

const base = process.argv[2] || "http://localhost:3000";
const saida = process.argv[3] || "audit-responsivo";
const candidatos = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const exe = candidatos.find((c) => existsSync(c));
if (!exe) throw new Error("Browser não encontrado: define BROWSER=<caminho>");

const ECRAS = [
  { nome: "telemovel", w: 390, h: 844, mobile: true },
  { nome: "tablet", w: 820, h: 1180, mobile: true },
  { nome: "desktop", w: 1440, h: 900, mobile: false },
];
const PAGINAS = ["/", "/marcar", "/equipa/login", "/faq"];
const temLogin = Boolean(process.env.AUDIT_EMAIL && process.env.AUDIT_PASSWORD);
if (temLogin) PAGINAS.push("/equipa", "/equipa/historico");

const medir = `(() => {
  const r = { hScroll: document.documentElement.scrollWidth > innerWidth + 1, pequenos: [], texto: [], semNome: [] };
  const alvos = document.querySelectorAll("a,button,input:not([type=hidden]),select,textarea,[role=button],[tabindex]");
  alvos.forEach((e) => {
    const b = e.getBoundingClientRect();
    if (!b.width || !b.height || getComputedStyle(e).visibility === "hidden") return;
    const rotulo = (e.getAttribute("aria-label") || e.innerText || e.title || (e.id && document.querySelector('label[for="' + e.id + '"]')?.innerText) || e.placeholder || "").trim();
    const id = e.tagName.toLowerCase() + (rotulo ? '"' + rotulo.slice(0, 22) + '"' : "");
    if (b.width < 44 || b.height < 44) r.pequenos.push(id + " " + Math.round(b.width) + "x" + Math.round(b.height));
    if (!rotulo && e.tagName !== "INPUT") r.semNome.push(id + "." + String(e.className).slice(0, 25));
  });
  document.querySelectorAll("body *").forEach((e) => {
    if (e.children.length || !e.textContent.trim()) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 12) r.texto.push(Math.round(fs * 10) / 10 + "px " + e.textContent.trim().slice(0, 22));
  });
  r.pequenos = [...new Set(r.pequenos)].slice(0, 30);
  r.texto = [...new Set(r.texto)].slice(0, 12);
  r.semNome = [...new Set(r.semNome)].slice(0, 10);
  return JSON.stringify(r);
})()`;

mkdirSync(saida, { recursive: true });
const porta = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(exe, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${porta}`, `--user-data-dir=${saida}/.perfil`, "about:blank"], { stdio: "ignore" });

async function ligar() {
  for (let i = 0; i < 40; i++) {
    try {
      const alvos = await (await fetch(`http://127.0.0.1:${porta}/json`)).json();
      const p = alvos.find((t) => t.type === "page");
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await esperar(250);
  }
  throw new Error("Não consegui ligar ao browser");
}

const ws = new WebSocket(await ligar());
await new Promise((ok) => (ws.onopen = ok));
let n = 0;
const pendentes = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pendentes.has(d.id)) pendentes.get(d.id)(d);
};
const cmd = (metodo, params = {}) =>
  new Promise((ok, falha) => {
    const id = ++n;
    const t = setTimeout(() => falha(new Error("Sem resposta do browser a " + metodo)), 20000);
    pendentes.set(id, (d) => (clearTimeout(t), d.error ? falha(new Error(d.error.message)) : ok(d.result)));
    ws.send(JSON.stringify({ id, method: metodo, params }));
  });
const avaliar = async (js) => (await cmd("Runtime.evaluate", { expression: js, returnByValue: true, awaitPromise: true })).result.value;
const captura = async (ficheiro) => {
  try {
    writeFileSync(`${saida}/${ficheiro}`, Buffer.from((await cmd("Page.captureScreenshot", { format: "png" })).data, "base64"));
  } catch (e) {
    console.error(`(sem captura de ${ficheiro}: ${e.message})`);
  }
};

await cmd("Page.enable");
const relatorio = [];
if (temLogin) {
  await cmd("Page.navigate", { url: base + "/equipa/login" });
  await esperar(2000);
  const ok = await avaliar(`(async () => {
    const { csrfToken } = await (await fetch("/api/auth/csrf")).json();
    const r = await fetch("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, email: ${JSON.stringify(process.env.AUDIT_EMAIL || "")}, password: ${JSON.stringify(process.env.AUDIT_PASSWORD || "")}, json: "true" }) });
    return r.ok;
  })()`);
  if (!ok) console.error("Login falhou: a área da equipa não será auditada com sessão.");
}
try {
  for (const e of ECRAS) {
    await cmd("Emulation.setDeviceMetricsOverride", { width: e.w, height: e.h, deviceScaleFactor: 2, mobile: e.mobile });
    await cmd("Emulation.setTouchEmulationEnabled", { enabled: e.mobile });
    for (const p of PAGINAS) {
      await cmd("Page.navigate", { url: base + p });
      await esperar(2500);
      const nome = `${e.nome}${p === "/" ? "-home" : p.replaceAll("/", "-")}`;
      await captura(`${nome}.png`);
      relatorio.push({ ecra: e.nome, pagina: p, ...JSON.parse(await avaliar(medir)) });
      if (p === "/marcar") {
        // Passo 2: escolhe o primeiro serviço e avança, para medir o calendário e as horas.
        await avaliar(`(() => { const b = [...document.querySelectorAll("button")].find((x) => /\\d+ ?min/.test(x.innerText)); b && b.click(); })()`);
        await esperar(1500);
        await avaliar(`(() => { const b = [...document.querySelectorAll("button")].find((x) => /continuar|seguinte|avançar/i.test(x.innerText)); b && b.click(); })()`);
        await esperar(2500);
        await captura(`${nome}-passo2.png`);
        relatorio.push({ ecra: e.nome, pagina: "/marcar (passo 2)", ...JSON.parse(await avaliar(medir)) });
      }
    }
  }
} catch (e) {
  console.error("Auditoria interrompida (relatório parcial):", e.message);
}
ws.close();
proc.kill();
writeFileSync(`${saida}/relatorio.json`, JSON.stringify(relatorio, null, 2));
for (const r of relatorio) {
  console.log(`\n[${r.ecra}] ${r.pagina}  scroll-horizontal=${r.hScroll}`);
  if (r.pequenos.length) console.log("  alvos <44px:", r.pequenos.join(" | "));
  if (r.texto.length) console.log("  texto <12px:", r.texto.join(" | "));
  if (r.semNome.length) console.log("  sem nome:", r.semNome.join(" | "));
}
process.exit(0); // o browser headless pode manter handles abertos
