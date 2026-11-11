import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/security/AuthOptions";
import { moverAgendamentoSchema } from "@/presentation/validation/schemas";
import { HttpResponse } from "@/presentation/http/HttpResponse";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { TwilioWhatsAppGateway } from "@/infrastructure/gateways/TwilioWhatsAppGateway";
import { AtualizarAgendamentoEquipaUseCase } from "@/application/use-cases/agendamento/AtualizarAgendamentoEquipaUseCase";
import { SlotIndisponivelError } from "@/domain/errors/DomainError";

const useCase = new AtualizarAgendamentoEquipaUseCase({
  agendamentoRepository: new PostgresAgendamentoRepository(),
  notificationGateway: new TwilioWhatsAppGateway(),
});

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return HttpResponse.unauthorized("Não autenticado.");

  const { id } = await params;
  const parsed = moverAgendamentoSchema.safeParse(await HttpResponse.lerJson(req));
  if (!parsed.success) return HttpResponse.badRequest("Dados inválidos.");

  try {
    const agendamento = await useCase.execute({ id, patch: parsed.data });
    return NextResponse.json({ agendamento });
  } catch (err) {
    if (err instanceof SlotIndisponivelError) {
      return HttpResponse.conflict("Esse profissional já tem uma marcação nesse horário.");
    }
    return HttpResponse.tratarErro(err);
  }
}
