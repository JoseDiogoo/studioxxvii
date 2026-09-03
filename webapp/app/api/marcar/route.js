import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSalaoId } from "@/lib/salao";
import { marcarSchema } from "@/lib/schemas";
import { prepararServicos, encaixarHorario } from "@/lib/disponibilidade";
import { parseDateOnly } from "@/lib/date";
import { pagamentoAntecipadoAtivo, iniciarPagamentoMBWay } from "@/lib/pagamentos";
import { confirmarAgendamentosDoGrupo, cancelarAgendamentosDoGrupo } from "@/lib/agendamentos";

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const parsed = marcarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do formulário inválidos." }, { status: 400 });
  }

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
  const exigePagamento = pagamentoAntecipadoAtivo();

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
          status: exigePagamento ? "PENDENTE_PAGAMENTO" : "CONFIRMADO",
        },
      });
      agendamentos.push(agendamento);
    }

    return { cliente: clienteDb, agendamentos };
  });

  const total = resultado.agendamentos.reduce((acc, a) => acc + a.valor, 0);

  if (!exigePagamento) {
    await confirmarAgendamentosDoGrupo(grupoId, { pago: false });
    return NextResponse.json({ grupoId, data, horaInicio, total, aguardaPagamento: false });
  }

  let pagamento;
  try {
    pagamento = await iniciarPagamentoMBWay({ telefone: cliente.telefone, valor: total, orderId: grupoId });
  } catch (err) {
    await cancelarAgendamentosDoGrupo(grupoId);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  await prisma.agendamento.updateMany({
    where: { grupoId },
    data: { metodoPagamento: "MBWAY", referenciaPagamento: pagamento.requestId },
  });

  return NextResponse.json({ grupoId, data, horaInicio, total, aguardaPagamento: true });
}
