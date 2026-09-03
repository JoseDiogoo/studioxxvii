import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateOnly, formatDateOnly, addDays, inicioFimDoDiaUTC } from "@/lib/date";

const SLOT_MINUTOS = 30;

function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function paraHora(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const inicioParam = searchParams.get("inicio");
  const colaboradorId = searchParams.get("colaboradorId");
  if (!inicioParam) {
    return NextResponse.json({ error: "Falta a data de início." }, { status: 400 });
  }

  const inicioSemana = parseDateOnly(inicioParam);

  const colaboradores = await prisma.colaborador.findMany({
    where: { ativo: true, ...(colaboradorId ? { id: colaboradorId } : {}) },
    select: { id: true, nome: true },
  });
  const colaboradorIds = colaboradores.map((c) => c.id);

  if (colaboradorIds.length === 0) {
    return NextResponse.json({ dias: [] });
  }

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const dia = addDays(inicioSemana, i);
    const diaSemana = dia.getUTCDay();
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
        select: { colaboradorId: true, horaInicio: true, horaFim: true },
      }),
    ]);

    if (horarios.length === 0) {
      dias.push({ data: formatDateOnly(dia), diaSemana, aberto: false, slots: [], livres: [] });
      continue;
    }

    const horarioPorColaborador = new Map();
    for (const h of horarios) {
      if (!horarioPorColaborador.has(h.colaboradorId)) horarioPorColaborador.set(h.colaboradorId, []);
      horarioPorColaborador.get(h.colaboradorId).push([paraMinutos(h.inicio), paraMinutos(h.fim)]);
    }

    const ocupadoPorColaborador = new Map();
    for (const a of agendamentos) {
      if (!ocupadoPorColaborador.has(a.colaboradorId)) ocupadoPorColaborador.set(a.colaboradorId, []);
      ocupadoPorColaborador.get(a.colaboradorId).push([paraMinutos(a.horaInicio), paraMinutos(a.horaFim)]);
    }

    let minInicio = Infinity;
    let maxFim = 0;
    for (const janelas of horarioPorColaborador.values()) {
      for (const [ini, fim] of janelas) {
        minInicio = Math.min(minInicio, ini);
        maxFim = Math.max(maxFim, fim);
      }
    }

    const slots = [];
    for (let m = minInicio; m < maxFim; m += SLOT_MINUTOS) {
      let total = 0;
      let livres = 0;
      for (const cid of colaboradorIds) {
        const janelas = horarioPorColaborador.get(cid) || [];
        const trabalha = janelas.some(([ini, fim]) => ini <= m && m + SLOT_MINUTOS <= fim);
        if (!trabalha) continue;
        total += 1;
        const ocupados = ocupadoPorColaborador.get(cid) || [];
        const ocupado = ocupados.some(([oi, of_]) => m < of_ && oi < m + SLOT_MINUTOS);
        if (!ocupado) livres += 1;
      }
      slots.push({ hora: paraHora(m), total, livres, estado: total === 0 ? "fechado" : livres > 0 ? "livre" : "ocupado" });
    }

    // Junta blocos consecutivos livres numa lista de intervalos, para o resumo de texto.
    const livresRanges = [];
    let atual = null;
    for (const s of slots) {
      if (s.estado === "livre") {
        if (!atual) atual = { inicio: s.hora, fimMin: paraMinutos(s.hora) + SLOT_MINUTOS };
        else atual.fimMin = paraMinutos(s.hora) + SLOT_MINUTOS;
      } else if (atual) {
        livresRanges.push({ inicio: atual.inicio, fim: paraHora(atual.fimMin) });
        atual = null;
      }
    }
    if (atual) livresRanges.push({ inicio: atual.inicio, fim: paraHora(atual.fimMin) });

    dias.push({ data: formatDateOnly(dia), diaSemana, aberto: true, slots, livres: livresRanges });
  }

  return NextResponse.json({ dias, colaboradores });
}
