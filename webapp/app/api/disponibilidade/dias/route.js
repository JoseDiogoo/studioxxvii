import { NextResponse } from "next/server";
import { disponibilidadeDiasSchema } from "@/lib/schemas";
import { prepararServicos, horariosDisponiveisNoDia } from "@/lib/disponibilidade";
import { parseDateOnly, formatDateOnly, addDays } from "@/lib/date";

const MAX_DIAS = 62;

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const parsed = disponibilidadeDiasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { servicos, de, ate } = parsed.data;

  let servicosPreparados;
  try {
    servicosPreparados = await prepararServicos(servicos);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const inicio = parseDateOnly(de);
  const fim = parseDateOnly(ate);
  const dias = [];

  let cursor = inicio;
  let i = 0;
  while (cursor <= fim && i < MAX_DIAS) {
    const slots = await horariosDisponiveisNoDia(servicosPreparados, cursor);
    if (slots.length > 0) dias.push(formatDateOnly(cursor));
    cursor = addDays(cursor, 1);
    i++;
  }

  return NextResponse.json({ dias });
}
