import { z } from "zod";

export const servicoSelecionadoSchema = z.object({
  servicoId: z.string().min(1),
  colaboradorId: z.string().min(1).nullable().optional(),
});

export const disponibilidadeDiasSchema = z.object({
  servicos: z.array(servicoSelecionadoSchema).min(1).max(3),
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ano: z.number().optional(),
  mes: z.number().optional(),
});

export const disponibilidadeHorasSchema = z.object({
  servicos: z.array(servicoSelecionadoSchema).min(1).max(3),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const clienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  // Normalizado (sem espaços, pontos, hífenes ou parênteses) para o limite por telefone não se contornar com formatações diferentes.
  telefone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v.replace(/[\s().-]/g, ""))
    .refine((v) => /^\+?\d{9,15}$/.test(v), "Telefone inválido."),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const marcarSchema = z.object({
  cliente: clienteSchema,
  servicos: z.array(servicoSelecionadoSchema).min(1).max(3),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  empresaSite: z.string().max(200).optional(),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const moverAgendamentoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaInicio: hhmm.optional(),
  horaFim: hhmm.optional(),
  colaboradorId: z.string().min(1).optional(),
  pago: z.boolean().optional(),
  metodoPagamento: z.enum(["DINHEIRO", "MULTIBANCO", "MBWAY", "CARTAO", "OUTRO"]).nullable().optional(),
  status: z.enum(["CONFIRMADO", "CANCELADO", "CONCLUIDO"]).optional(),
  observacoes: z.string().trim().max(500).nullable().optional(),
}).refine((v) => !(v.horaInicio && v.horaFim) || v.horaFim > v.horaInicio, "A hora de fim tem de ser depois da de início.");
