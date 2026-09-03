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
 * Sincroniza com o Google Calendar do respetivo colaborador e avisa o cliente
 * por WhatsApp, para todos os agendamentos recém-criados de um grupo (mesma
 * marcação/carrinho). O pagamento só é registado mais tarde pela equipa, depois
 * do corte, em /equipa.
 */
export async function confirmarAgendamentosDoGrupo(grupoId) {
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
