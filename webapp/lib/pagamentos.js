// Pagamento antecipado por MB Way via ifthenpay (API SPG).
// https://ifthenpay.com — não precisa de licença de instituição de pagamento própria.

const MBWAY_PAYMENT_URL = "https://ifthenpay.com/api/spg/payment/mbway";

export function pagamentoAntecipadoAtivo() {
  return Boolean(process.env.IFTHENPAY_MBWAY_KEY);
}

function normalizarTelefoneMBWay(telefone) {
  const digitos = telefone.replace(/\D/g, "").slice(-9);
  return `351#${digitos}`;
}

/** Inicia um pedido de pagamento MB Way. orderId deve ser único (usamos o grupoId da marcação). */
export async function iniciarPagamentoMBWay({ telefone, valor, orderId }) {
  const mbWayKey = process.env.IFTHENPAY_MBWAY_KEY;
  if (!mbWayKey) {
    throw new Error("Pagamento por MB Way não está configurado.");
  }

  const res = await fetch(MBWAY_PAYMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mbWayKey,
      orderId,
      amount: valor.toFixed(2),
      mobileNumber: normalizarTelefoneMBWay(telefone),
      email: "",
      description: "Studio XXVII - marcação",
    }),
  }).catch(() => null);

  const data = await res?.json().catch(() => null);
  if (!res?.ok || !data || data.Status !== "000") {
    throw new Error(data?.Message || "Não foi possível iniciar o pagamento por MB Way. Tenta novamente.");
  }
  return { requestId: data.RequestId };
}

/** Valida a chave anti-phishing enviada pelo ifthenpay no callback de confirmação. */
export function callbackAutorizado(chaveRecebida) {
  const chaveEsperada = process.env.IFTHENPAY_ANTIPHISHING_KEY;
  return Boolean(chaveEsperada) && chaveRecebida === chaveEsperada;
}
