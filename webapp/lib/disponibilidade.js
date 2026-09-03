import { prisma } from "@/lib/prisma";
import { inicioFimDoDiaUTC, formatDateOnly } from "@/lib/date";
import { agoraEmPortugal } from "@/lib/timezone";

const SLOT_STEP_MINUTES = 15;

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

async function colaboradoresElegiveis(servicoId, colaboradorId) {
  if (colaboradorId) return [colaboradorId];
  const rels = await prisma.colaboradorServico.findMany({
    where: { servicoId, colaborador: { ativo: true } },
    select: { colaboradorId: true },
  });
  return rels.map((r) => r.colaboradorId);
}

async function carregarContexto(colaboradorIds, dia, diaSemana) {
  const { inicio: inicioDia, fim: fimDia } = inicioFimDoDiaUTC(dia);

  const [horarios, agendamentos] = await Promise.all([
    prisma.horario.findMany({
      where: { colaboradorId: { in: colaboradorIds }, diaSemana },
    }),
    prisma.agendamento.findMany({
      where: {
        colaboradorId: { in: colaboradorIds },
        data: { gte: inicioDia, lte: fimDia },
        status: { not: "CANCELADO" },
      },
    }),
  ]);

  const horarioPorColaborador = new Map();
  for (const h of horarios) {
    if (!horarioPorColaborador.has(h.colaboradorId)) horarioPorColaborador.set(h.colaboradorId, []);
    horarioPorColaborador.get(h.colaboradorId).push(h);
  }

  const ocupadoPorColaborador = new Map();
  for (const a of agendamentos) {
    if (!ocupadoPorColaborador.has(a.colaboradorId)) ocupadoPorColaborador.set(a.colaboradorId, []);
    ocupadoPorColaborador.get(a.colaboradorId).push([timeToMinutes(a.horaInicio), timeToMinutes(a.horaFim)]);
  }

  return { horarioPorColaborador, ocupadoPorColaborador };
}

function colaboradorLivre(colaboradorId, inicioMin, fimMin, horarioPorColaborador, ocupadoPorColaborador) {
  const horarios = horarioPorColaborador.get(colaboradorId) || [];
  const dentroDoHorario = horarios.some(
    (h) => timeToMinutes(h.inicio) <= inicioMin && fimMin <= timeToMinutes(h.fim)
  );
  if (!dentroDoHorario) return false;

  const ocupados = ocupadoPorColaborador.get(colaboradorId) || [];
  return !ocupados.some(([oi, of_]) => inicioMin < of_ && oi < fimMin);
}

function tentarEncaixe(startMin, servicosPreparados, horarioPorColaborador, ocupadoPorColaborador) {
  let cursor = startMin;
  const atribuicao = [];
  for (const { servicoId, elegiveis, duracaoMinutos } of servicosPreparados) {
    const fimServico = cursor + duracaoMinutos;
    const escolhido = elegiveis.find((cid) =>
      colaboradorLivre(cid, cursor, fimServico, horarioPorColaborador, ocupadoPorColaborador)
    );
    if (!escolhido) return null;
    atribuicao.push({
      servicoId,
      colaboradorId: escolhido,
      horaInicio: minutesToTime(cursor),
      horaFim: minutesToTime(fimServico),
    });
    cursor = fimServico;
  }
  return atribuicao;
}

/** servicos: [{ servicoId, colaboradorId? }] — colaboradorId ausente/null = "sem preferência" */
export async function prepararServicos(servicos) {
  if (!Array.isArray(servicos) || servicos.length === 0) {
    throw new Error("É preciso escolher pelo menos um serviço.");
  }

  const servicoIds = servicos.map((s) => s.servicoId);
  const servicosDb = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, ativo: true },
  });
  const porId = new Map(servicosDb.map((s) => [s.id, s]));

  const preparados = [];
  for (const s of servicos) {
    const servicoDb = porId.get(s.servicoId);
    if (!servicoDb) throw new Error("Serviço inválido.");
    const elegiveis = await colaboradoresElegiveis(s.servicoId, s.colaboradorId || null);
    if (elegiveis.length === 0) throw new Error(`Sem profissional disponível para "${servicoDb.titulo}".`);
    preparados.push({
      servicoId: s.servicoId,
      elegiveis,
      duracaoMinutos: servicoDb.duracaoMinutos,
      preco: servicoDb.preco,
    });
  }
  return preparados;
}

export async function horariosDisponiveisNoDia(servicosPreparados, dia) {
  const diaSemana = dia.getUTCDay();
  const colaboradorIdsRelevantes = [...new Set(servicosPreparados.flatMap((s) => s.elegiveis))];
  if (colaboradorIdsRelevantes.length === 0) return [];

  const { horarioPorColaborador, ocupadoPorColaborador } = await carregarContexto(
    colaboradorIdsRelevantes,
    dia,
    diaSemana
  );
  if (horarioPorColaborador.size === 0) return [];

  let minInicio = Infinity;
  let maxFim = 0;
  for (const horarios of horarioPorColaborador.values()) {
    for (const h of horarios) {
      minInicio = Math.min(minInicio, timeToMinutes(h.inicio));
      maxFim = Math.max(maxFim, timeToMinutes(h.fim));
    }
  }
  if (!isFinite(minInicio)) return [];

  const { dataStr: hojeStr, minutos: minutosAgora } = agoraEmPortugal();
  const ehHoje = formatDateOnly(dia) === hojeStr;

  const validos = [];
  for (let start = minInicio; start <= maxFim; start += SLOT_STEP_MINUTES) {
    if (ehHoje && start <= minutosAgora) continue;
    const atribuicao = tentarEncaixe(start, servicosPreparados, horarioPorColaborador, ocupadoPorColaborador);
    if (atribuicao) validos.push({ horaInicio: minutesToTime(start), atribuicao });
  }
  return validos;
}

export async function encaixarHorario(servicosPreparados, dia, horaInicio) {
  const slots = await horariosDisponiveisNoDia(servicosPreparados, dia);
  return slots.find((s) => s.horaInicio === horaInicio) || null;
}
