// Teste de integração com a BD real (não corre em "npm test"; usar "npm run test:db").
// Cria os seus próprios dados (um salão à parte) e apaga-os no fim.
import test from "node:test";
import assert from "node:assert/strict";
import { SlotIndisponivelError } from "@/domain/errors/DomainError";
import { postgresDb as db } from "@/infrastructure/database/postgres";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";

test("três marcações simultâneas na mesma hora: só uma passa", async () => {
  const repo = new PostgresAgendamentoRepository();
  const salao = await db.salao.create({ data: { nome: "Teste", morada: "Teste" } });
  try {
    const colab = await db.colaborador.create({
      data: { salaoId: salao.id, nome: "T", email: `teste-${Date.now()}@teste.local`, passwordHash: "x" },
    });
    const servico = await db.servico.create({ data: { salaoId: salao.id, titulo: "T", preco: 10, duracaoMinutos: 30 } });
    const dia = new Date("2999-01-05T00:00:00.000Z");

    const tentar = (telefone) =>
      repo.criarAgendamentosEmTransacao({
        clienteData: { nome: "C", telefone },
        agendamentosData: [
          { grupoId: telefone, colaboradorId: colab.id, servicoId: servico.id, data: dia, horaInicio: "10:00", horaFim: "10:30", valor: 10 },
        ],
        salaoId: salao.id,
        dia,
      });

    const r = await Promise.allSettled([tentar("+351900000001"), tentar("+351900000002"), tentar("+351900000003")]);
    assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
    for (const x of r.filter((x) => x.status === "rejected")) assert.ok(x.reason instanceof SlotIndisponivelError);
  } finally {
    await db.salao.delete({ where: { id: salao.id } });
    await db.$disconnect();
  }
});
