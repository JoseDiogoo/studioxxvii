import test from "node:test";
import assert from "node:assert/strict";
import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";
import { marcarSchema, moverAgendamentoSchema } from "@/presentation/validation/schemas";

const horarios = [{ colaboradorId: "c1", inicio: "10:00", fim: "13:00" }];
const servico = (duracaoMinutos) => [{ servicoId: "s1", elegiveis: ["c1"], duracaoMinutos }];

test("horas de 30 em 30 minutos até à hora de fim do horário (a última pode começar nela)", () => {
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(30), horarios, agendamentos: [],
  }).map((s) => s.horaInicio);
  assert.deepEqual(slots, ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"]);
});

test("serviço de 45 min também pode começar na última hora do horário e acabar depois", () => {
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(45), horarios, agendamentos: [],
  }).map((s) => s.horaInicio);
  assert.equal(slots.at(-1), "13:00"); // acaba às 13:45, depois do fim do horário
  assert.ok(!slots.includes("13:30"));
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

test("depois de um corte de 45 min a hora seguinte é logo a do fim dele (sem 15 min mortos)", () => {
  const marcado = [{ colaboradorId: "c1", horaInicio: "10:00", horaFim: "10:45", status: "CONFIRMADO" }];
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(45), horarios, agendamentos: marcado,
  }).map((s) => s.horaInicio);
  assert.ok(slots.includes("10:45") && !slots.includes("10:00") && !slots.includes("10:30"));
  // nunca começa depois da hora de fim do horário (13:00)
  assert.ok(slots.every((h) => h <= "13:00"));
});

test("Pack 27 (1h20) pode começar às 13:00, a última hora do horário, e acabar depois", () => {
  const slots = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
    servicosPreparados: servico(80), horarios, agendamentos: [],
  }).map((h) => h.horaInicio);
  assert.equal(slots.at(-1), "13:00");
});

test("ninguém começa depois da hora de fim do horário (19:00), nem à hora 'seguinte' a uma marcação", () => {
  const h = [{ colaboradorId: "c1", inicio: "10:00", fim: "19:00" }];
  const marcado = [{ colaboradorId: "c1", horaInicio: "18:30", horaFim: "19:15", status: "CONFIRMADO" }];
  const horas = (d, ag = []) =>
    CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({ servicosPreparados: servico(d), horarios: h, agendamentos: ag }).map((x) => x.horaInicio);
  assert.equal(horas(45).at(-1), "19:00");
  assert.equal(horas(80).at(-1), "19:00"); // Pack 27 às 19:00 acaba às 20:20
  assert.ok(!horas(30).includes("20:00") && !horas(30).includes("19:30"));
  assert.ok(!horas(30, marcado).includes("19:15")); // o fim da marcação (19:15) já passa das 19:00
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
