import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { moverAgendamentoSchema } from "@/presentation/validation/schemas";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { GoogleCalendarGateway } from "@/infrastructure/gateways/GoogleCalendarGateway";
import { TwilioWhatsAppGateway } from "@/infrastructure/gateways/TwilioWhatsAppGateway";
import { DateUtil } from "@/infrastructure/utils/DateUtil";
import { HorarioSlot } from "@/domain/value-objects/HorarioSlot";

const agendamentoRepo = new PostgresAgendamentoRepository();
const calendarGateway = new GoogleCalendarGateway();
const notificationGateway = new TwilioWhatsAppGateway();

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return HttpResponse.unauthorized("Não autenticado.");
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = moverAgendamentoSchema.safeParse(body);
  if (!parsed.success) {
    return HttpResponse.badRequest("Dados inválidos.");
  }

  const atual = await agendamentoRepo.findById(id);
  if (!atual) {
    return HttpResponse.notFound("Agendamento não encontrado.");
  }

  const patch = parsed.data;
  const novaData = patch.data ? new Date(patch.data) : atual.data;
  const novoInicio = patch.horaInicio ?? atual.horaInicio;
  const novoFim = patch.horaFim ?? atual.horaFim;
  const novoColaboradorId = patch.colaboradorId ?? atual.colaboradorId;

  const mudouHorarioOuColaborador =
    patch.data !== undefined ||
    patch.horaInicio !== undefined ||
    patch.horaFim !== undefined ||
    patch.colaboradorId !== undefined;

  if (mudouHorarioOuColaborador) {
    const { inicio: inicioDia, fim: fimDia } = DateUtil.inicioFimDoDiaUTC(novaData);

    const outros = await agendamentoRepo.findByColaboradoresEData(
      [novoColaboradorId],
      inicioDia,
      fimDia
    );

    const novoInicioMin = HorarioSlot.timeToMinutes(novoInicio);
    const novoFimMin = HorarioSlot.timeToMinutes(novoFim);

    const conflito = outros.some(
      (o) => o.id !== id &&
             o.status !== "CANCELADO" &&
             novoInicioMin < HorarioSlot.timeToMinutes(o.horaFim) &&
             HorarioSlot.timeToMinutes(o.horaInicio) < novoFimMin
    );

    if (conflito) {
      return HttpResponse.conflict("Esse profissional já tem uma marcação nesse horário.");
    }
  }

  const dadosUpdate = {};
  if (patch.data !== undefined) dadosUpdate.data = novaData;
  if (patch.horaInicio !== undefined) dadosUpdate.horaInicio = patch.horaInicio;
  if (patch.horaFim !== undefined) dadosUpdate.horaFim = patch.horaFim;
  if (patch.colaboradorId !== undefined) dadosUpdate.colaboradorId = patch.colaboradorId;
  if (patch.pago !== undefined) dadosUpdate.pago = patch.pago;
  if (patch.metodoPagamento !== undefined) dadosUpdate.metodoPagamento = patch.metodoPagamento;
  if (patch.status !== undefined) dadosUpdate.status = patch.status;
  if (patch.observacoes !== undefined) dadosUpdate.observacoes = patch.observacoes;

  const atualizado = await agendamentoRepo.update(id, dadosUpdate);

  const foiCancelado = patch.status === "CANCELADO" && atual.status !== "CANCELADO";

  if (foiCancelado) {
    calendarGateway.removerEvento(atualizado).catch(() => {});
    if (atualizado.cliente) {
      notificationGateway.enviarCancelamento({
        telefone: atualizado.cliente.telefone,
        nomeCliente: atualizado.cliente.nome,
        servicoTitulo: atualizado.servico?.titulo || "Serviço",
        dataStr: DateUtil.formatDateOnly(atualizado.data),
        horaInicio: atualizado.horaInicio,
      }).catch(() => {});
    }
  } else if (mudouHorarioOuColaborador && atual.status === "CONFIRMADO") {
    if (atualizado.cliente) {
      notificationGateway.enviarReagendamento({
        telefone: atualizado.cliente.telefone,
        nomeCliente: atualizado.cliente.nome,
        servicoTitulo: atualizado.servico?.titulo || "Serviço",
        dataStr: DateUtil.formatDateOnly(atualizado.data),
        horaInicio: atualizado.horaInicio,
      }).catch(() => {});
    }
    calendarGateway.sincronizarEvento(atualizado).catch(() => {});
  } else if (mudouHorarioOuColaborador) {
    calendarGateway.sincronizarEvento(atualizado).catch(() => {});
  }

  return NextResponse.json({ agendamento: atualizado });
}
