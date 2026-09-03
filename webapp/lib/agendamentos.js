import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/date";
import { sincronizarGoogleCalendar } from "@/lib/googleCalendar";
import { enviarWhatsApp, mensagemConfirmacao } from "@/lib/notificacoes";

const INCLUDE_PADRAO = {
  cliente: { select: { nome: true, telefone: true } },
  servico: { select: { titulo: true, preco: true } },
  colaborador: { select: { id: true, nome: true } },
};

/**
 * Confirma todos os agendamentos de um grupo (mesma marcação/carrinho): marca como
 * CONFIRMADO + pago, sincroniza com o Google Calendar do respetivo colaborador e
 * avisa o cliente por WhatsApp. Usado tanto quando não há pagamento antecipado
 * configurado, como no callback de confirmação do MB Way.
 */
export async function confirmarAgendamentosDoGrupo(grupoId, { metodoPagamento = null, pago = false } = {}) {
  await prisma.agendamento.updateMany({
    where: { grupoId, status: "PENDENTE_PAGAMENTO" },
    data: { status: "CONFIRMADO", pago, ...(metodoPagamento ? { metodoPagamento } : {}) },
  });

  const agendamentos = await prisma.agendamento.findMany({
    where: { grupoId },
    include: INCLUDE_PADRAO,
  });

  for (const agendamento of agendamentos) {
    sincronizarGoogleCalendar(agendamento).catch(() => {});
  }

  const primeiro = agendamentos[0];
  if (primeiro) {
    const dataStr = formatDateOnly(new Date(primeiro.data));
    const titulos = agendamentos.map((a) => a.servico.titulo).join(" + ");
    enviarWhatsApp({
      telefone: primeiro.cliente.telefone,
      mensagem: mensagemConfirmacao({
        nomeCliente: primeiro.cliente.nome,
        servicoTitulo: titulos,
        dataStr,
        horaInicio: primeiro.horaInicio,
      }),
    }).catch(() => {});
  }

  return agendamentos;
}

/** Liberta o horário quando o pagamento falha, expira ou é recusado. */
export async function cancelarAgendamentosDoGrupo(grupoId) {
  await prisma.agendamento.updateMany({
    where: { grupoId, status: "PENDENTE_PAGAMENTO" },
    data: { status: "CANCELADO" },
  });
}
