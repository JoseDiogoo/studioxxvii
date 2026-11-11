import test from "node:test";
import assert from "node:assert/strict";
import { CriarAgendamentoPublicoUseCase } from "@/application/use-cases/agendamento/CriarAgendamentoPublicoUseCase";
import { AtualizarAgendamentoEquipaUseCase } from "@/application/use-cases/agendamento/AtualizarAgendamentoEquipaUseCase";
import { SlotIndisponivelError, RegraNegocioError, EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";

// Dia daqui a 7 dias (UTC) e o respetivo dia da semana, para o horário de trabalho bater certo.
const d = new Date(Date.now() + 7 * 86_400_000);
const DATA = d.toISOString().slice(0, 10);
const DIA_SEMANA = d.getUTCDay();

function montar({ pendentes = 0, ocupados = [] } = {}) {
  const criadas = [];
  const agendamentoRepository = {
    contarPendentesPorTelefone: async () => pendentes,
    findByColaboradoresEData: async () => ocupados,
    criarAgendamentosEmTransacao: async ({ agendamentosData }) => {
      criadas.push(...agendamentosData);
      return { agendamentos: agendamentosData.map((a) => ({ ...a, valor: Number(a.valor) })) };
    },
  };
  const useCase = new CriarAgendamentoPublicoUseCase({
    agendamentoRepository,
    colaboradorRepository: { findElegiveisPorServico: async () => [{ id: "c1" }] },
    servicoRepository: { findByIds: async () => [{ id: "s1", titulo: "Corte", preco: 15, duracaoMinutos: 30 }] },
    horarioRepository: {
      findByColaboradoresEDiaSemana: async () => [{ colaboradorId: "c1", diaSemana: DIA_SEMANA, inicio: "10:00", fim: "13:00" }],
    },
    salaoRepository: { getPrimeiroSalao: async () => ({ id: "salao1" }) },
    notificationGateway: null,
  });
  return { useCase, criadas };
}

const pedido = (extra = {}) => ({
  cliente: { nome: "Rui", telefone: "+351912345678" },
  servicos: [{ servicoId: "s1" }],
  data: DATA,
  horaInicio: "11:00",
  ...extra,
});

test("marcação válida é criada com o preço do serviço", async () => {
  const { useCase, criadas } = montar();
  const r = await useCase.execute(pedido());
  assert.equal(r.total, 15);
  assert.equal(criadas.length, 1);
  assert.equal(criadas[0].horaInicio, "11:00");
});

test("hora já ocupada é recusada", async () => {
  const { useCase } = montar({ ocupados: [{ colaboradorId: "c1", horaInicio: "11:00", horaFim: "11:30", status: "CONFIRMADO" }] });
  await assert.rejects(useCase.execute(pedido()), SlotIndisponivelError);
});

test("hora fora do horário de trabalho é recusada", async () => {
  const { useCase } = montar();
  await assert.rejects(useCase.execute(pedido({ horaInicio: "14:00" })), SlotIndisponivelError);
});

test("data no passado e demasiado longe são recusadas", async () => {
  const { useCase } = montar();
  await assert.rejects(useCase.execute(pedido({ data: "2020-01-01" })), SlotIndisponivelError);
  await assert.rejects(useCase.execute(pedido({ data: "2999-01-01" })), SlotIndisponivelError);
});

test("limite de marcações pendentes por telefone", async () => {
  const { useCase } = montar({ pendentes: 3 });
  await assert.rejects(useCase.execute(pedido()), RegraNegocioError);
});

test("honeypot preenchido finge sucesso e não grava nada", async () => {
  const { useCase, criadas } = montar();
  const r = await useCase.execute(pedido({ empresaSite: "spam.com" }));
  assert.equal(r.total, 0);
  assert.equal(criadas.length, 0);
});

// ---- PATCH da equipa ----
function montarEquipa(atual) {
  const chamadas = [];
  const repo = {
    findById: async (id) => (id === "a1" ? atual : null),
    update: async (id, dados) => (chamadas.push(["update", dados]), { ...atual, ...dados }),
    atualizarSemConflito: async (id, dados, slot) => (chamadas.push(["slot", dados, slot]), { ...atual, ...dados }),
  };
  const notificacoes = [];
  const gw = {
    enviarCancelamento: async () => notificacoes.push("cancelamento"),
    enviarReagendamento: async () => notificacoes.push("reagendamento"),
  };
  return {
    useCase: new AtualizarAgendamentoEquipaUseCase({ agendamentoRepository: repo, notificationGateway: gw }),
    chamadas,
    notificacoes,
  };
}

const base = () => ({
  id: "a1", colaboradorId: "c1", status: "CONFIRMADO", horaInicio: "10:00", horaFim: "10:30",
  data: new Date(`${DATA}T00:00:00.000Z`), cliente: { nome: "Rui", telefone: "+351912345678" }, servico: { titulo: "Corte" },
});

test("marcação inexistente", async () => {
  const { useCase } = montarEquipa(base());
  await assert.rejects(useCase.execute({ id: "x", patch: {} }), EntidadeNaoEncontradaError);
});

test("hora de fim antes do início é recusada", async () => {
  const { useCase } = montarEquipa(base());
  await assert.rejects(useCase.execute({ id: "a1", patch: { horaInicio: "11:00", horaFim: "10:30" } }), RegraNegocioError);
});

test("mudar a hora passa pela verificação de conflito e avisa o cliente", async () => {
  const { useCase, chamadas, notificacoes } = montarEquipa(base());
  await useCase.execute({ id: "a1", patch: { horaInicio: "11:00", horaFim: "11:30" } });
  assert.equal(chamadas[0][0], "slot");
  assert.deepEqual(notificacoes, ["reagendamento"]);
});

test("só pagamento não verifica conflito", async () => {
  const { useCase, chamadas, notificacoes } = montarEquipa(base());
  await useCase.execute({ id: "a1", patch: { pago: true, metodoPagamento: "MBWAY" } });
  assert.equal(chamadas[0][0], "update");
  assert.deepEqual(notificacoes, []);
});

test("cancelar não verifica conflito; reativar verifica", async () => {
  const a = montarEquipa(base());
  await a.useCase.execute({ id: "a1", patch: { status: "CANCELADO" } });
  assert.equal(a.chamadas[0][0], "update");
  assert.deepEqual(a.notificacoes, ["cancelamento"]);

  const b = montarEquipa({ ...base(), status: "CANCELADO" });
  await b.useCase.execute({ id: "a1", patch: { status: "CONFIRMADO" } });
  assert.equal(b.chamadas[0][0], "slot");
});
