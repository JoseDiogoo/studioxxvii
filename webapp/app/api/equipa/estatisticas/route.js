import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ESTADOS_VALIDOS = ["CONFIRMADO", "CONCLUIDO"];

function chaveDia(date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  const colaboradorId = searchParams.get("colaboradorId");

  if (!de || !ate) {
    return NextResponse.json({ error: "Falta o intervalo de datas." }, { status: 400 });
  }

  const dataInicio = new Date(`${de}T00:00:00`);
  const dataFim = new Date(`${ate}T23:59:59`);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      data: { gte: dataInicio, lte: dataFim },
      ...(colaboradorId ? { colaboradorId } : {}),
    },
    include: {
      servico: { select: { id: true, titulo: true } },
      colaborador: { select: { id: true, nome: true } },
    },
    orderBy: { data: "asc" },
  });

  const validos = agendamentos.filter((a) => ESTADOS_VALIDOS.includes(a.status));
  const porPagar = validos.filter((a) => !a.pago);

  const receitaTotal = validos.reduce((acc, a) => acc + a.valor, 0);
  const totalMarcacoes = validos.length;
  const ticketMedio = totalMarcacoes ? receitaTotal / totalMarcacoes : 0;
  const receitaPendente = porPagar.reduce((acc, a) => acc + a.valor, 0);

  const porDiaMap = new Map();
  for (const a of validos) {
    const chave = chaveDia(a.data);
    porDiaMap.set(chave, (porDiaMap.get(chave) || 0) + a.valor);
  }
  const receitaPorDia = [...porDiaMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([data, total]) => ({ data, total: Math.round(total * 100) / 100 }));

  const porServicoMap = new Map();
  for (const a of validos) {
    const atual = porServicoMap.get(a.servicoId) || { servicoId: a.servicoId, titulo: a.servico.titulo, quantidade: 0, receita: 0 };
    atual.quantidade += 1;
    atual.receita += a.valor;
    porServicoMap.set(a.servicoId, atual);
  }
  const porServico = [...porServicoMap.values()]
    .map((s) => ({ ...s, receita: Math.round(s.receita * 100) / 100 }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const porMetodoMap = new Map();
  for (const a of validos) {
    if (!a.pago) continue;
    const metodo = a.metodoPagamento || "OUTRO";
    const atual = porMetodoMap.get(metodo) || { metodo, quantidade: 0, receita: 0 };
    atual.quantidade += 1;
    atual.receita += a.valor;
    porMetodoMap.set(metodo, atual);
  }
  const porMetodo = [...porMetodoMap.values()]
    .map((m) => ({ ...m, receita: Math.round(m.receita * 100) / 100 }))
    .sort((a, b) => b.receita - a.receita);

  const porColaboradorMap = new Map();
  for (const a of validos) {
    const atual = porColaboradorMap.get(a.colaboradorId) || { colaboradorId: a.colaboradorId, nome: a.colaborador.nome, quantidade: 0, receita: 0 };
    atual.quantidade += 1;
    atual.receita += a.valor;
    porColaboradorMap.set(a.colaboradorId, atual);
  }
  const porColaborador = [...porColaboradorMap.values()]
    .map((c) => ({ ...c, receita: Math.round(c.receita * 100) / 100 }))
    .sort((a, b) => b.receita - a.receita);

  return NextResponse.json({
    resumo: {
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      totalMarcacoes,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      receitaPendente: Math.round(receitaPendente * 100) / 100,
      marcacoesPendentes: porPagar.length,
    },
    receitaPorDia,
    porServico,
    porMetodo,
    porColaborador,
  });
}
