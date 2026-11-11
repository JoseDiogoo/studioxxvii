// Teste de ponta a ponta com a BD PostgreSQL real: clientes em /marcar e agenda/histórico em /equipa.
// Uso (servidor a correr, ex. npm run dev):
//   node --env-file=.env scripts/testar-cenarios-reais.mjs [baseUrl] [--manter]
//   (ou: npm run test:e2e)
// Cria 2 barbeiros de teste (e2e-*@teste.local, Terça a Sábado 10h-19h), corre os cenários e, no fim,
// apaga tudo o que criou (marcações, clientes e barbeiros), a não ser que use --manter.
import pkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = pkg;
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) || "http://localhost:3000";
const MANTER = args.includes("--manter");
const db = new PrismaClient();

const PASSWORD = "E2e-Teste-" + Math.random().toString(36).slice(2, 10); // só existe durante o teste
const TEL = (n) => `+3519009910${n}`; // prefixo próprio para limpar no fim
const EMAILS = ["e2e-barbeiro1@teste.local", "e2e-barbeiro2@teste.local"];

const resultados = [];
const anomalias = [];
const ok = (fase, nome, cond, detalhe = "") => {
  resultados.push({ fase, nome, ok: Boolean(cond), detalhe });
  console.log(`${cond ? "✅" : "❌"} [${fase}] ${nome}${detalhe ? " — " + detalhe : ""}`);
  return Boolean(cond);
};
const aviso = (texto) => {
  anomalias.push(texto);
  console.log(`⚠️  ${texto}`);
};

// ---------- utilitários ----------
function proximoDia(diaSemana) {
  // Próxima ocorrência (estritamente depois de hoje) do dia da semana, em AAAA-MM-DD, pelo calendário de Lisboa.
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
  const d = new Date(`${hoje}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() !== diaSemana);
  return d.toISOString().slice(0, 10);
}
const somarMin = (hhmm, min) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

async function api(caminho, { metodo = "GET", corpo, cookie, ip = "10.77.0.1" } = {}) {
  const r = await fetch(BASE + caminho, {
    method: metodo,
    headers: { "Content-Type": "application/json", "x-real-ip": ip, ...(cookie ? { cookie } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await r.json();
  } catch {}
  return { status: r.status, json, headers: r.headers };
}

async function login(email, password) {
  const jar = {};
  const guardar = (res) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const [par] = c.split(";");
      const i = par.indexOf("=");
      jar[par.slice(0, i)] = par.slice(i + 1);
    }
  };
  const cookieStr = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  const r1 = await fetch(BASE + "/api/auth/csrf");
  guardar(r1);
  const { csrfToken } = await r1.json();
  const r2 = await fetch(BASE + "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieStr(), "x-real-ip": "10.77.9.9" },
    body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
    redirect: "manual",
  });
  guardar(r2);
  return { status: r2.status, cookie: cookieStr() };
}

// ---------- preparação / limpeza ----------
async function preparar() {
  const salao = await db.salao.findFirst();
  const servicos = await db.servico.findMany({ where: { ativo: true } });
  const hash = await bcrypt.hash(PASSWORD, 10);
  const barbeiros = [];
  for (const email of EMAILS) {
    await db.colaborador.deleteMany({ where: { email } });
    const c = await db.colaborador.create({
      data: { nome: `E2E ${email.split("@")[0].slice(4)}`, email, passwordHash: hash, salaoId: salao.id, ativo: true },
    });
    await db.colaboradorServico.createMany({ data: servicos.map((s) => ({ colaboradorId: c.id, servicoId: s.id })) });
    await db.horario.createMany({
      data: [2, 3, 4, 5, 6].map((d) => ({ salaoId: salao.id, colaboradorId: c.id, diaSemana: d, inicio: "10:00", fim: "19:00" })),
    });
    barbeiros.push(c);
  }
  return { salao, servicos, barbeiros };
}

async function limpar() {
  const clientes = await db.cliente.deleteMany({ where: { telefone: { startsWith: "+3519009910" } } }); // apaga marcações em cascata
  const colabs = await db.colaborador.deleteMany({ where: { email: { in: EMAILS } } });
  return { clientes: clientes.count, barbeiros: colabs.count };
}

// ---------- cenários ----------
async function main() {
  const saude = await api("/api/health").catch(() => ({ status: 0 }));
  if (saude.status !== 200) {
    console.error(`Servidor não responde em ${BASE}. Arranca-o primeiro (npm run dev).`);
    process.exit(2);
  }
  await limpar(); // restos de uma execução interrompida

  const { servicos, barbeiros } = await preparar();
  const [b1, b2] = barbeiros;
  const sv = (titulo) => servicos.find((s) => s.titulo === titulo);
  const corte = sv("Corte Cabelo"), corteBarba = sv("Corte + Barba"), rapar = sv("Rapar Cabelo");
  if (!corte || !corteBarba || !rapar) throw new Error("Faltam serviços na BD (Corte Cabelo, Corte + Barba, Rapar Cabelo).");

  const quinta = proximoDia(4), sexta = proximoDia(5);
  console.log(`\nBase: ${BASE} | Quinta: ${quinta} | Sexta: ${sexta} | Barbeiro 1: ${b1.nome} | Barbeiro 2: ${b2.nome}\n`);

  // ======================= FASE 1: CLIENTES =======================
  console.log("--- FASE 1: lado do cliente (/marcar) ---");
  const marcar = (cliente, servicosSel, data, horaInicio, ip, extra = {}) =>
    api("/api/marcar", { metodo: "POST", ip, corpo: { cliente, servicos: servicosSel, data, horaInicio, ...extra } });

  // A — marcação simples
  const A = await marcar({ nome: "Cliente A Teste", telefone: TEL("01") }, [{ servicoId: corte.id, colaboradorId: b1.id }], quinta, "10:00", "10.77.1.1");
  ok("1", "Cliente A: marcação simples confirmada", A.status === 200 && A.json?.grupoId, `HTTP ${A.status}`);
  ok("1", "Cliente A: total da confirmação correto", Number(A.json?.total) === Number(corte.preco), `total ${A.json?.total} (esperado ${Number(corte.preco)})`);
  const agA = await db.agendamento.findFirst({ where: { cliente: { telefone: TEL("01") } } });
  ok("1", "Cliente A: gravado com o Barbeiro 1 às 10:00-10:30", agA && agA.colaboradorId === b1.id && agA.horaInicio === "10:00" && agA.horaFim === "10:30", agA ? `${agA.horaInicio}-${agA.horaFim}` : "não gravou");

  // B — carrinho com 2 serviços, sem preferência, tarde
  const dias = await api("/api/disponibilidade/horas", { metodo: "POST", ip: "10.77.2.1", corpo: { servicos: [{ servicoId: corteBarba.id }, { servicoId: rapar.id }], data: quinta } });
  const slotsTarde = (dias.json?.slots || []).filter((h) => minutos(h) >= 14 * 60);
  ok("1", "Cliente B: há horas livres à tarde (sem preferência de profissional)", slotsTarde.length > 0, `${slotsTarde.length} horas (ex. ${slotsTarde.slice(0, 3).join(", ")})`);
  const horaB = slotsTarde[0];
  const B = await marcar({ nome: "Cliente B Teste", telefone: TEL("02") }, [{ servicoId: corteBarba.id }, { servicoId: rapar.id }], quinta, horaB, "10.77.2.1");
  ok("1", "Cliente B: marcação com 2 serviços confirmada", B.status === 200, `HTTP ${B.status} ${B.json?.error || ""}`);
  const esperadoB = Number(corteBarba.preco) + Number(rapar.preco);
  ok("1", "Cliente B: total é a soma dos serviços", Number(B.json?.total) === esperadoB, `total ${B.json?.total} (esperado ${esperadoB})`);
  const linhasB = await db.agendamento.findMany({ where: { cliente: { telefone: TEL("02") } }, orderBy: { horaInicio: "asc" }, include: { colaborador: true, servico: true } });
  ok("1", "Cliente B: um barbeiro atribuído automaticamente a cada serviço", linhasB.length === 2 && linhasB.every((l) => l.colaboradorId), linhasB.map((l) => `${l.servico.titulo}→${l.colaborador.nome}`).join(" | "));
  const seq = linhasB.length === 2 && linhasB[0].horaInicio === horaB && linhasB[0].horaFim === linhasB[1].horaInicio &&
    minutos(linhasB[0].horaFim) - minutos(linhasB[0].horaInicio) === corteBarba.duracaoMinutos &&
    minutos(linhasB[1].horaFim) - minutos(linhasB[1].horaInicio) === rapar.duracaoMinutos;
  ok("1", "Cliente B: horas sequenciais e durações certas", seq, linhasB.map((l) => `${l.horaInicio}-${l.horaFim}`).join(" → "));
  if (linhasB.some((l) => !EMAILS.includes(l.colaborador.email))) aviso("Cliente B foi atribuído a um barbeiro real (não de teste): a 'sem preferência' usa todos os profissionais ativos. Será limpo no fim.");

  // C — conflito
  const C = await marcar({ nome: "Cliente C Teste", telefone: TEL("03") }, [{ servicoId: corte.id, colaboradorId: b1.id }], quinta, "10:00", "10.77.3.1");
  ok("1", "Cliente C: mesma hora e barbeiro do Cliente A é rejeitada (409)", C.status === 409, `HTTP ${C.status} — "${C.json?.error || ""}"`);
  ok("1", "Cliente C: nada foi gravado", (await db.agendamento.count({ where: { cliente: { telefone: TEL("03") } } })) === 0);

  // D — observações + telefone internacional + honeypot
  const D = await marcar({ nome: "Cliente D Teste", telefone: "+351 900 991 004", observacoes: "Prefere máquina 2 nos lados" }, [{ servicoId: corte.id, colaboradorId: b1.id }], sexta, "11:00", "10.77.4.1");
  ok("1", "Cliente D: marcação com observações e +351 confirmada", D.status === 200, `HTTP ${D.status} ${D.json?.error || ""}`);
  const agD = await db.agendamento.findFirst({ where: { cliente: { telefone: TEL("04") } }, include: { cliente: true } });
  ok("1", "Cliente D: telefone normalizado (+351900991004) e observação gravada na marcação", agD && agD.cliente.telefone === "+351900991004" && agD.observacoes === "Prefere máquina 2 nos lados", agD ? `tel ${agD.cliente.telefone}; obs "${agD.observacoes}"` : "não gravou");
  const H = await marcar({ nome: "Robô Honeypot", telefone: TEL("05") }, [{ servicoId: corte.id, colaboradorId: b1.id }], sexta, "12:00", "10.77.5.1", { empresaSite: "spam.com" });
  ok("1", "Honeypot: resposta parece sucesso (não denuncia a armadilha)", H.status === 200, `HTTP ${H.status}`);
  ok("1", "Honeypot: NÃO gravou na BD", (await db.agendamento.count({ where: { cliente: { telefone: TEL("05") } } })) === 0 && (await db.cliente.count({ where: { telefone: TEL("05") } })) === 0);

  // ======================= FASE 2: BARBEIRO =======================
  console.log("\n--- FASE 2: lado do barbeiro (/equipa) ---");
  const sessao = await login(EMAILS[0], PASSWORD);
  ok("2", "Login do Barbeiro 1", sessao.status === 200 && /session-token/.test(sessao.cookie), `HTTP ${sessao.status}`);
  const mau = await login(EMAILS[0], "password-errada");
  ok("2", "Login com password errada é recusado", mau.status === 401, `HTTP ${mau.status}`);
  const semLogin = await api("/api/equipa/agendamentos?inicio=2026-01-01&fim=2026-01-07");
  ok("2", "Agenda sem sessão devolve 401", semLogin.status === 401, `HTTP ${semLogin.status}`);
  const cookie = sessao.cookie;

  const semanaIni = quinta, semanaFim = sexta;
  const ag = await api(`/api/equipa/agendamentos?inicio=${semanaIni}&fim=${semanaFim}`, { cookie });
  const lista = ag.json?.agendamentos || [];
  const por = (tel) => lista.filter((x) => x.cliente?.telefone === tel);
  const camposOk = (x, nome, tel, titulo, valor) => x && x.cliente.nome === nome && x.cliente.telefone === tel && x.servico.titulo === titulo && Number(x.valor) === Number(valor);
  ok("2", "Agenda semanal carrega (200)", ag.status === 200, `${lista.length} marcações no intervalo`);
  ok("2", "Agenda: Cliente A com nome, telefone, serviço e valor corretos", camposOk(por(TEL("01"))[0], "Cliente A Teste", TEL("01"), "Corte Cabelo", corte.preco));
  ok("2", "Agenda: Cliente B (2 serviços) com valores corretos", por(TEL("02")).length === 2 && por(TEL("02")).some((x) => camposOk(x, "Cliente B Teste", TEL("02"), "Corte + Barba", corteBarba.preco)) && por(TEL("02")).some((x) => camposOk(x, "Cliente B Teste", TEL("02"), "Rapar Cabelo", rapar.preco)));
  ok("2", "Agenda: Cliente D com observação e telefone", por(TEL("04"))[0]?.observacoes === "Prefere máquina 2 nos lados");
  ok("2", "Agenda: Cliente C e Honeypot NÃO aparecem", por(TEL("03")).length === 0 && por(TEL("05")).length === 0);

  // Reagendamento A (+30 min)
  const idA = agA.id;
  const R1 = await api(`/api/equipa/agendamentos/${idA}`, { metodo: "PATCH", cookie, corpo: { horaInicio: "10:30", horaFim: "11:00" } });
  const aDepois = await db.agendamento.findUnique({ where: { id: idA } });
  ok("2", "Reagendar A +30 min (início e fim)", R1.status === 200 && aDepois.horaInicio === "10:30" && aDepois.horaFim === "11:00", `${aDepois.horaInicio}-${aDepois.horaFim}`);
  const R2 = await api(`/api/equipa/agendamentos/${idA}`, { metodo: "PATCH", cookie, corpo: { horaInicio: "10:00" } }); // só o início, como num arrastar
  const aDepois2 = await db.agendamento.findUnique({ where: { id: idA } });
  const dur = minutos(aDepois2.horaFim) - minutos(aDepois2.horaInicio);
  ok("2", "Mover A só com a hora de início mantém a duração (30 min)", R2.status === 200 && dur === corte.duracaoMinutos, `HTTP ${R2.status}; ${aDepois2.horaInicio}-${aDepois2.horaFim} = ${dur} min`);
  if (dur !== corte.duracaoMinutos) aviso(`Mover uma marcação enviando só horaInicio altera a duração (${aDepois2.horaInicio}-${aDepois2.horaFim} = ${dur} min em vez de ${corte.duracaoMinutos}). A API deve recalcular a hora de fim.`);
  const R3 = await api(`/api/equipa/agendamentos/${idA}`, { metodo: "PATCH", cookie, corpo: { horaInicio: "10:30", horaFim: "11:00" } });
  ok("2", "A volta a ficar em 10:30-11:00 para os passos seguintes", R3.status === 200);
  const R4 = await api(`/api/equipa/agendamentos/${idA}`, { metodo: "PATCH", cookie, corpo: { horaInicio: "10:00", horaFim: "10:30", colaboradorId: "nao-existe" } });
  ok("2", "Atribuir a profissional inexistente é recusado (400, não 500)", R4.status === 400, `HTTP ${R4.status}`);
  // mover A para cima do B deve dar 409
  const linhaB0 = linhasB[0];
  const R5 = await api(`/api/equipa/agendamentos/${idA}`, { metodo: "PATCH", cookie, corpo: { colaboradorId: linhaB0.colaboradorId, horaInicio: linhaB0.horaInicio, horaFim: somarMin(linhaB0.horaInicio, 30) } });
  ok("2", "Arrastar A para cima de outra marcação do mesmo barbeiro é recusado (409)", R5.status === 409, `HTTP ${R5.status}`);

  // Cancelamento de D e libertação do horário
  const idD = agD.id;
  const horasAntes = await api("/api/disponibilidade/horas", { metodo: "POST", ip: "10.77.6.1", corpo: { servicos: [{ servicoId: corte.id, colaboradorId: b1.id }], data: sexta } });
  ok("2", "Antes de cancelar: 11:00 de sexta NÃO está livre (Barbeiro 1)", !(horasAntes.json?.slots || []).includes("11:00"));
  const X = await api(`/api/equipa/agendamentos/${idD}`, { metodo: "PATCH", cookie, corpo: { status: "CANCELADO" } });
  const dDepois = await db.agendamento.findUnique({ where: { id: idD } });
  ok("2", "Cliente D cancelado → status CANCELADO na BD", X.status === 200 && dDepois.status === "CANCELADO", `HTTP ${X.status}; ${dDepois.status}`);
  const horasDepois = await api("/api/disponibilidade/horas", { metodo: "POST", ip: "10.77.6.2", corpo: { servicos: [{ servicoId: corte.id, colaboradorId: b1.id }], data: sexta } });
  ok("2", "Depois de cancelar: 11:00 de sexta volta a estar livre", (horasDepois.json?.slots || []).includes("11:00"));
  const E = await marcar({ nome: "Cliente E Teste", telefone: TEL("06") }, [{ servicoId: corte.id, colaboradorId: b1.id }], sexta, "11:00", "10.77.7.1");
  ok("2", "Outro cliente (E) consegue marcar o horário libertado", E.status === 200, `HTTP ${E.status} ${E.json?.error || ""}`);
  const dAgenda = (await api(`/api/equipa/agendamentos?inicio=${sexta}&fim=${sexta}`, { cookie })).json?.agendamentos || [];
  const dNaAgenda = dAgenda.find((x) => x.id === idD);
  ok("2", "A agenda mostra a marcação cancelada com status CANCELADO", dNaAgenda?.status === "CANCELADO");
  const pendDepois = await db.agendamento.count({ where: { cliente: { telefone: TEL("04") }, status: "CONFIRMADO" } });
  ok("2", "Cancelada deixa de contar como pendente do cliente D", pendDepois === 0);

  // Histórico (só agendamentos: quem, que serviço, que dia, que horas)
  const h1 = await api(`/api/equipa/historico?q=${encodeURIComponent("Cliente B")}`, { cookie });
  ok("2", "Histórico: pesquisa por nome 'Cliente B' devolve só o B (2 linhas)", h1.status === 200 && (h1.json?.agendamentos || []).length === 2 && h1.json.agendamentos.every((x) => x.cliente.nome === "Cliente B Teste"), `${(h1.json?.agendamentos || []).length} linhas`);
  const h2 = await api(`/api/equipa/historico?q=${encodeURIComponent("Teste")}&pageSize=100`, { cookie });
  const meus = (h2.json?.agendamentos || []).filter((x) => x.cliente.telefone.startsWith("+3519009910"));
  ok("2", "Histórico: lista as 5 marcações de teste (inclui a cancelada)", meus.length === 5, `${meus.length} linhas`);
  const linhaA = meus.find((x) => x.cliente.telefone === TEL("01"));
  ok("2", "Histórico: A com serviço, dia e horas certos (10:30-11:00)", linhaA && linhaA.servico.titulo === "Corte Cabelo" && String(linhaA.data).startsWith(quinta) && linhaA.horaInicio === "10:30" && linhaA.horaFim === "11:00");
  const chaves = Object.keys(h2.json?.agendamentos?.[0] || {}).concat(Object.keys(ag.json?.agendamentos?.[0] || {}));
  ok("2", "Sem registo de pagamento em nenhuma resposta (nem 'pago' nem 'metodoPagamento')", !chaves.some((k) => /pago|metodoPagamento/i.test(k)), chaves.length + " campos verificados");
  const h3 = await api(`/api/equipa/historico?de=${quinta}&ate=${quinta}&pageSize=100`, { cookie });
  const diaQuinta = (h3.json?.agendamentos || []).filter((x) => x.cliente.telefone.startsWith("+3519009910"));
  ok("2", "Histórico: filtro por dia (quinta) devolve A e as 2 linhas do B", diaQuinta.length === 3, `${diaQuinta.length} linhas`);

  // ======================= RELATÓRIO =======================
  console.log("\n--- ESTADO FINAL DOS DADOS (antes da limpeza) ---");
  const final = await db.agendamento.findMany({
    where: { cliente: { telefone: { startsWith: "+3519009910" } } },
    include: { cliente: true, servico: true, colaborador: true },
    orderBy: [{ data: "asc" }, { horaInicio: "asc" }],
  });
  console.table(final.map((x) => ({
    data: x.data.toISOString().slice(0, 10), hora: `${x.horaInicio}-${x.horaFim}`, cliente: x.cliente.nome,
    servico: x.servico.titulo, barbeiro: x.colaborador.nome, status: x.status, obs: x.observacoes || "",
  })));
  console.log(`Clientes de teste: ${await db.cliente.count({ where: { telefone: { startsWith: "+3519009910" } } })} | Marcações: ${final.length}`);

  if (MANTER) {
    console.log(`\n(--manter) dados mantidos. Barbeiros de teste: ${EMAILS.join(", ")} / password desta execução: ${PASSWORD}`);
  } else {
    const l = await limpar();
    console.log(`\nLimpeza: ${l.clientes} clientes (e as suas marcações) e ${l.barbeiros} barbeiros de teste apagados.`);
  }

  const passou = resultados.filter((r) => r.ok).length;
  const falhou = resultados.filter((r) => !r.ok);
  console.log("\n================ RELATÓRIO ================");
  console.log(`✅ Passaram: ${passou}/${resultados.length}`);
  if (falhou.length) {
    console.log(`❌ Falharam: ${falhou.length}`);
    for (const f of falhou) console.log(`   - [${f.fase}] ${f.nome} ${f.detalhe ? "(" + f.detalhe + ")" : ""}`);
  }
  if (anomalias.length) {
    console.log(`⚠️  Anomalias / fricções: ${anomalias.length}`);
    anomalias.forEach((a, i) => console.log(`   ${i + 1}. ${a}`));
  }
  await db.$disconnect();
  process.exit(falhou.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("Erro no teste:", e);
  try {
    if (!MANTER) await limpar();
  } catch {}
  await db.$disconnect();
  process.exit(1);
});
