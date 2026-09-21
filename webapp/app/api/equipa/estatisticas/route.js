import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";

const agendamentoRepo = new PostgresAgendamentoRepository();
const ESTADOS_VALIDOS = ["CONFIRMADO", "CONCLUIDO"];

function chaveDia(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  const { searchParams } = req.nextUrl;
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  const colaboradorId = searchParams.get("colaboradorId");

  if (!de || !ate) {
    return HttpResponse.badRequest("Falta o intervalo de datas.");
  }

  const dataInicio = new Date(`${de}T00:00:00`);
  const dataFim = new Date(`${ate}T23:59:59`);

  try {
    const agendamentos = await agendamentoRepo.findParaEquipa({
      colaboradorId,
      dataInicio,
      dataFim,
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
      const sId = a.servicoId;
      const titulo = a.servico?.titulo || "Serviço";
      const atual = porServicoMap.get(sId) || { servicoId: sId, titulo, quantidade: 0, receita: 0 };
      atual.quantidade += 1;
      atual.receita += a.valor;
      porServicoMap.set(sId, atual);
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
      const cId = a.colaboradorId;
      const nome = a.colaborador?.nome || "Colaborador";
      const atual = porColaboradorMap.get(cId) || { colaboradorId: cId, nome, quantidade: 0, receita: 0 };
      atual.quantidade += 1;
      atual.receita += a.valor;
      porColaboradorMap.set(cId, atual);
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
  } catch (err) {
    return HttpResponse.tratarErro(err);
  }
}
