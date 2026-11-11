import test from "node:test";
import assert from "node:assert/strict";
import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";
import { marcarSchema, moverAgendamentoSchema } from "@/presentation/validation/schemas";

const horarios = [{ colaboradorId: "c1", inicio: "10:00", fim: "13:00" }];
const servico = (duracaoMinutos) => [{ servicoId: "s1", elegiveis: ["c1"], duracaoMinutos }];

test("horas de 30 em 30 minutos e só as que cabem no horário", () => {
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(30), horarios, agendamentos: [],
  }).map((s) => s.horaInicio);
  assert.deepEqual(slots, ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]);
});

test("serviço de 45 min não oferece a última meia hora", () => {
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(45), horarios, agendamentos: [],
  }).map((s) => s.horaInicio);
  assert.equal(slots.at(-1), "12:00");
});

test("hora marcada (e as que se sobrepõem) desaparece; marcação cancelada liberta", () => {
  const marcado = [{ colaboradorId: "c1", horaInicio: "11:00", horaFim: "11:30", status: "CONFIRMADO" }];
  const com = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(30), horarios, agendamentos: marcado,
  }).map((s) => s.horaInicio);
  assert.ok(!com.includes("11:00") && com.includes("10:30") && com.includes("11:30"));

  const cancelado = [{ ...marcado[0], status: "CANCELADO" }];
  const sem = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(30), horarios, agendamentos: cancelado,
  }).map((s) => s.horaInicio);
  assert.ok(sem.includes("11:00"));
});

test("IP vem de X-Real-IP; X-Forwarded-For falsificado é ignorado", () => {
  const req = (h) => ({ headers: new Headers(h) });
  assert.equal(RateLimiter.ipDoPedido(req({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" })), "1.2.3.4");
  assert.equal(RateLimiter.ipDoPedido(req({ "x-forwarded-for": "9.9.9.9" })), "desconhecido");
});

test("limite genérico bloqueia depois do máximo", () => {
  const chave = "teste:" + Math.random();
  const r = Array.from({ length: 5 }, () => RateLimiter.excedeu(chave, 3, 60_000));
  assert.deepEqual(r, [false, false, false, true, true]);
});

test("telefone é normalizado e inválidos são recusados", () => {
  const base = { servicos: [{ servicoId: "s1" }], data: "2026-11-24", horaInicio: "10:00" };
  const ok = marcarSchema.safeParse({ ...base, cliente: { nome: "Rui", telefone: "91 300-00.02" } });
  assert.equal(ok.success, true);
  assert.equal(ok.data.cliente.telefone, "913000002");
  for (const t of ["abc", "123", "9130000", "+999999999999999999"]) {
    assert.equal(marcarSchema.safeParse({ ...base, cliente: { nome: "Rui", telefone: t } }).success, false, t);
  }
  assert.equal(marcarSchema.safeParse({ ...base, horaInicio: "25:99", cliente: { nome: "Rui", telefone: "913000002" } }).success, false);
  assert.equal(marcarSchema.safeParse({ ...base, servicos: Array(5).fill({ servicoId: "s" }), cliente: { nome: "Rui", telefone: "913000002" } }).success, false);
});

test("hora de fim tem de ser depois da de início", () => {
  assert.equal(moverAgendamentoSchema.safeParse({ horaInicio: "11:00", horaFim: "10:30" }).success, false);
  assert.equal(moverAgendamentoSchema.safeParse({ horaInicio: "10:00", horaFim: "10:30" }).success, true);
});
