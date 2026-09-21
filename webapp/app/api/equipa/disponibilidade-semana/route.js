import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { PostgresHorarioRepository } from "@/infrastructure/database/repositories/PostgresHorarioRepository";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { DateUtil } from "@/infrastructure/utils/DateUtil";
import { HorarioSlot } from "@/domain/value-objects/HorarioSlot";

const SLOT_MINUTOS = 30;

const colaboradorRepo = new PostgresColaboradorRepository();
const horarioRepo = new PostgresHorarioRepository();
const agendamentoRepo = new PostgresAgendamentoRepository();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  const { searchParams } = req.nextUrl;
  const inicioParam = searchParams.get("inicio");
  const colaboradorId = searchParams.get("colaboradorId");
  if (!inicioParam) {
    return HttpResponse.badRequest("Falta a data de início.");
  }

  const inicioSemana = DateUtil.parseDateOnly(inicioParam);

  const colaboradores = await colaboradorRepo.findAtivos();
  const colaboradoresFiltrados = colaboradorId
    ? colaboradores.filter((c) => c.id === colaboradorId)
    : colaboradores;

  const colaboradorIds = colaboradoresFiltrados.map((c) => c.id);

  if (colaboradorIds.length === 0) {
    return NextResponse.json({ dias: [] });
  }

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setUTCDate(dia.getUTCDate() + i);

    const diaSemana = dia.getUTCDay();
    const { inicio: inicioDia, fim: fimDia } = DateUtil.inicioFimDoDiaUTC(dia);

    const [horarios, agendamentos] = await Promise.all([
      horarioRepo.findByColaboradoresEDiaSemana(colaboradorIds, diaSemana),
      agendamentoRepo.findByColaboradoresEData(colaboradorIds, inicioDia, fimDia),
    ]);

    if (horarios.length === 0) {
      dias.push({ data: DateUtil.formatDateOnly(dia), diaSemana, aberto: false, slots: [], livres: [] });
      continue;
    }

    const horarioPorColaborador = new Map();
    for (const h of horarios) {
      if (!horarioPorColaborador.has(h.colaboradorId)) horarioPorColaborador.set(h.colaboradorId, []);
      horarioPorColaborador.get(h.colaboradorId).push([HorarioSlot.timeToMinutes(h.inicio), HorarioSlot.timeToMinutes(h.fim)]);
    }

    const ocupadoPorColaborador = new Map();
    for (const a of agendamentos) {
      if (!ocupadoPorColaborador.has(a.colaboradorId)) ocupadoPorColaborador.set(a.colaboradorId, []);
      ocupadoPorColaborador.get(a.colaboradorId).push([HorarioSlot.timeToMinutes(a.horaInicio), HorarioSlot.timeToMinutes(a.horaFim)]);
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
      slots.push({ hora: HorarioSlot.minutesToTime(m), total, livres, estado: total === 0 ? "fechado" : livres > 0 ? "livre" : "ocupado" });
    }

    const livresRanges = [];
    let atual = null;
    for (const s of slots) {
      if (s.estado === "livre") {
        if (!atual) atual = { inicio: s.hora, fimMin: HorarioSlot.timeToMinutes(s.hora) + SLOT_MINUTOS };
        else atual.fimMin = HorarioSlot.timeToMinutes(s.hora) + SLOT_MINUTOS;
      } else if (atual) {
        livresRanges.push({ inicio: atual.inicio, fim: HorarioSlot.minutesToTime(atual.fimMin) });
        atual = null;
      }
    }
    if (atual) livresRanges.push({ inicio: atual.inicio, fim: HorarioSlot.minutesToTime(atual.fimMin) });

    dias.push({ data: DateUtil.formatDateOnly(dia), diaSemana, aberto: true, slots, livres: livresRanges });
  }

  return NextResponse.json({ dias, colaboradores: colaboradoresFiltrados });
}
