import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moverAgendamentoSchema } from "@/lib/schemas";
import { inicioFimDoDiaUTC, formatDateOnly } from "@/lib/date";
import { sincronizarGoogleCalendar, removerEventoGoogleCalendar } from "@/lib/googleCalendar";
import { enviarWhatsApp, mensagemReagendamento, mensagemCancelamento } from "@/lib/notificacoes";

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = moverAgendamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const atual = await prisma.agendamento.findUnique({ where: { id } });
  if (!atual) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const patch = parsed.data;
  const novaData = patch.data ? new Date(patch.data) : atual.data;
  const novoInicio = patch.horaInicio ?? atual.horaInicio;
  const novoFim = patch.horaFim ?? atual.horaFim;
  const novoColaboradorId = patch.colaboradorId ?? atual.colaboradorId;

  const mudouHorarioOuColaborador =
    patch.data !== undefined ||
    patch.horaInicio !== undefined ||
    patch.horaFim !== undefined ||
    patch.colaboradorId !== undefined;

  if (mudouHorarioOuColaborador) {
    const { inicio: inicioDia, fim: fimDia } = inicioFimDoDiaUTC(novaData);

    const outros = await prisma.agendamento.findMany({
      where: {
        id: { not: id },
        colaboradorId: novoColaboradorId,
        data: { gte: inicioDia, lte: fimDia },
        status: { not: "CANCELADO" },
      },
      select: { horaInicio: true, horaFim: true },
    });

    const novoInicioMin = timeToMinutes(novoInicio);
    const novoFimMin = timeToMinutes(novoFim);
    const conflito = outros.some(
      (o) => novoInicioMin < timeToMinutes(o.horaFim) && timeToMinutes(o.horaInicio) < novoFimMin
    );
    if (conflito) {
      return NextResponse.json(
        { error: "Esse profissional já tem uma marcação nesse horário." },
        { status: 409 }
      );
    }
  }

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      ...(patch.data !== undefined ? { data: novaData } : {}),
      ...(patch.horaInicio !== undefined ? { horaInicio: patch.horaInicio } : {}),
      ...(patch.horaFim !== undefined ? { horaFim: patch.horaFim } : {}),
      ...(patch.colaboradorId !== undefined ? { colaboradorId: patch.colaboradorId } : {}),
      ...(patch.pago !== undefined ? { pago: patch.pago } : {}),
      ...(patch.metodoPagamento !== undefined ? { metodoPagamento: patch.metodoPagamento } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.observacoes !== undefined ? { observacoes: patch.observacoes } : {}),
    },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      servico: { select: { titulo: true, preco: true } },
      colaborador: { select: { id: true, nome: true } },
    },
  });

  const foiCancelado = patch.status === "CANCELADO" && atual.status !== "CANCELADO";

  if (foiCancelado) {
    removerEventoGoogleCalendar(atualizado).catch(() => {});
    enviarWhatsApp({
      telefone: atualizado.cliente.telefone,
      mensagem: mensagemCancelamento({
        nomeCliente: atualizado.cliente.nome,
        servicoTitulo: atualizado.servico.titulo,
        dataStr: formatDateOnly(new Date(atualizado.data)),
        horaInicio: atualizado.horaInicio,
      }),
    }).catch(() => {});
  } else if (mudouHorarioOuColaborador && atual.status === "CONFIRMADO") {
    // Avisa o cliente sempre que a equipa reagenda uma marcação já confirmada.
    enviarWhatsApp({
      telefone: atualizado.cliente.telefone,
      mensagem: mensagemReagendamento({
        nomeCliente: atualizado.cliente.nome,
        servicoTitulo: atualizado.servico.titulo,
        dataStr: formatDateOnly(new Date(atualizado.data)),
        horaInicio: atualizado.horaInicio,
      }),
    }).catch(() => {});
    sincronizarGoogleCalendar(atualizado).catch(() => {});
  } else if (mudouHorarioOuColaborador) {
    sincronizarGoogleCalendar(atualizado).catch(() => {});
  }

  return NextResponse.json({ agendamento: atualizado });
}
