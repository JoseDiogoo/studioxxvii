import { NextResponse } from "next/server";
import { disponibilidadeHorasSchema } from "@/lib/schemas";
import { prepararServicos, horariosDisponiveisNoDia } from "@/lib/disponibilidade";
import { parseDateOnly } from "@/lib/date";

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const parsed = disponibilidadeHorasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { servicos, data } = parsed.data;

  let servicosPreparados;
  try {
    servicosPreparados = await prepararServicos(servicos);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const dia = parseDateOnly(data);
  const slots = await horariosDisponiveisNoDia(servicosPreparados, dia);
  const horas = slots.map((s) => s.horaInicio);

  return NextResponse.json({ horas });
}
