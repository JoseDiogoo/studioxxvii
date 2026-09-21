import { z } from "zod";

export const servicoSelecionadoSchema = z.object({
  servicoId: z.string().min(1),
  colaboradorId: z.string().min(1).nullable().optional(),
});

export const disponibilidadeDiasSchema = z.object({
  servicos: z.array(servicoSelecionadoSchema).min(1),
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ano: z.number().optional(),
  mes: z.number().optional(),
});

export const disponibilidadeHorasSchema = z.object({
  servicos: z.array(servicoSelecionadoSchema).min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const clienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const marcarSchema = z.object({
  cliente: clienteSchema,
  servicos: z.array(servicoSelecionadoSchema).min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  empresaSite: z.string().optional(),
});

export const moverAgendamentoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  colaboradorId: z.string().min(1).optional(),
  pago: z.boolean().optional(),
  metodoPagamento: z.enum(["DINHEIRO", "MULTIBANCO", "MBWAY", "CARTAO", "OUTRO"]).nullable().optional(),
  status: z.enum(["CONFIRMADO", "CANCELADO", "CONCLUIDO"]).optional(),
  observacoes: z.string().trim().max(500).nullable().optional(),
});

export const reagendarSchema = moverAgendamentoSchema;

export const pagamentoSchema = z.object({
  pago: z.boolean(),
  metodoPagamento: z.enum(["DINHEIRO", "MULTIBANCO", "MBWAY", "CARTAO", "OUTRO"]).nullable().optional(),
});

export const perfilSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  passwordAtual: z.string().optional(),
  novaPassword: z.string().min(6, "Password deve ter pelo menos 6 caracteres").optional(),
});
