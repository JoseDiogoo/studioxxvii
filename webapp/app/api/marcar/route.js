import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSalaoId } from "@/lib/salao";
import { marcarSchema } from "@/lib/schemas";
import { prepararServicos, encaixarHorario } from "@/lib/disponibilidade";
import { parseDateOnly } from "@/lib/date";
import { confirmarAgendamentosDoGrupo } from "@/lib/agendamentos";
import { isBookingRateLimited, registerBookingAttempt } from "@/lib/rate-limit";

function ipDoPedido(req) {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "desconhecido";
}

export async function POST(req) {
  const ip = ipDoPedido(req);
  if (isBookingRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Tenta novamente daqui a uns minutos." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = marcarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do formulário inválidos." }, { status: 400 });
  }

  // Honeypot: campo invisível que só um bot preenche. Responde como se tivesse
  // corrido bem, sem criar nada, para não revelar ao bot que foi apanhado.
  if (parsed.data.empresaSite) {
    return NextResponse.json({ grupoId: crypto.randomUUID(), data: parsed.data.data, horaInicio: parsed.data.horaInicio, total: 0 });
  }

  registerBookingAttempt(ip);

  const { cliente, servicos, data, horaInicio } = parsed.data;

  let servicosPreparados;
  try {
    servicosPreparados = await prepararServicos(servicos);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const dia = parseDateOnly(data);
  const slot = await encaixarHorario(servicosPreparados, dia, horaInicio);
  if (!slot) {
    return NextResponse.json(
      { error: "Esse horário deixou de estar disponível. Escolhe outro." },
      { status: 409 }
    );
  }

  const salaoId = await getSalaoId();
  const precoPorServico = new Map(servicosPreparados.map((s) => [s.servicoId, s.preco]));
  const grupoId = crypto.randomUUID();

  const resultado = await prisma.$transaction(async (tx) => {
    const clienteDb = await tx.cliente.upsert({
      where: { salaoId_telefone: { salaoId, telefone: cliente.telefone } },
      update: {
        nome: cliente.nome,
        email: cliente.email || null,
        observacoes: cliente.observacoes || null,
      },
      create: {
        salaoId,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || null,
        observacoes: cliente.observacoes || null,
      },
    });

    const agendamentos = [];
    for (const item of slot.atribuicao) {
      const agendamento = await tx.agendamento.create({
        data: {
          grupoId,
          clienteId: clienteDb.id,
          colaboradorId: item.colaboradorId,
          servicoId: item.servicoId,
          data: dia,
          horaInicio: item.horaInicio,
          horaFim: item.horaFim,
          valor: precoPorServico.get(item.servicoId) ?? 0,
        },
      });
      agendamentos.push(agendamento);
    }

    return { cliente: clienteDb, agendamentos };
  });

  const total = resultado.agendamentos.reduce((acc, a) => acc + a.valor, 0);

  await confirmarAgendamentosDoGrupo(grupoId);
  return NextResponse.json({ grupoId, data, horaInicio, total });
}
