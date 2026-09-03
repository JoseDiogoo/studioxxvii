import { NextResponse } from "next/server";
import { callbackAutorizado } from "@/lib/pagamentos";
import { confirmarAgendamentosDoGrupo, cancelarAgendamentosDoGrupo } from "@/lib/agendamentos";

// Callback assíncrono do ifthenpay para o pagamento MB Way (GET com query params).
// Configurar este URL público (ex. https://studioxxvii.pt/api/pagamentos/callback)
// no backoffice ifthenpay, associado à chave MB Way.
export async function GET(req) {
  const { searchParams } = req.nextUrl;
  const chave = searchParams.get("chave");
  const idPedido = searchParams.get("idpedido");
  const estado = searchParams.get("estado");

  if (!callbackAutorizado(chave)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!idPedido) {
    return NextResponse.json({ error: "Falta idpedido." }, { status: 400 });
  }

  if (estado === "PAGO" || estado === "SUCCESS") {
    await confirmarAgendamentosDoGrupo(idPedido, { pago: true, metodoPagamento: "MBWAY" });
  } else if (estado === "RECUSADO" || estado === "DECLINED" || estado === "EXPIRADO") {
    await cancelarAgendamentosDoGrupo(idPedido);
  }

  return NextResponse.json({ ok: true });
}
