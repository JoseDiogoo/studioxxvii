import { HttpResponse } from "../http/HttpResponse";
import { marcarSchema, reagendarSchema, pagamentoSchema } from "../validation/schemas";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { PostgresServicoRepository } from "@/infrastructure/database/repositories/PostgresServicoRepository";
import { PostgresHorarioRepository } from "@/infrastructure/database/repositories/PostgresHorarioRepository";
import { PostgresSalaoRepository } from "@/infrastructure/database/repositories/PostgresSalaoRepository";
import { GoogleCalendarGateway } from "@/infrastructure/gateways/GoogleCalendarGateway";
import { TwilioWhatsAppGateway } from "@/infrastructure/gateways/TwilioWhatsAppGateway";

import { CriarAgendamentoPublicoUseCase } from "@/application/use-cases/agendamento/CriarAgendamentoPublicoUseCase";
import { ReagendarAgendamentoUseCase } from "@/application/use-cases/agendamento/ReagendarAgendamentoUseCase";
import { CancelarAgendamentoUseCase } from "@/application/use-cases/agendamento/CancelarAgendamentoUseCase";
import { RegistarPagamentoUseCase } from "@/application/use-cases/agendamento/RegistarPagamentoUseCase";
import { ObterAgendamentosEquipaUseCase } from "@/application/use-cases/agendamento/ObterAgendamentosEquipaUseCase";
import { ObterHistoricoAgendamentosUseCase } from "@/application/use-cases/agendamento/ObterHistoricoAgendamentosUseCase";
import { ObterEstatisticasEquipaUseCase } from "@/application/use-cases/agendamento/ObterEstatisticasEquipaUseCase";

function extrairIp(req) {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "desconhecido";
}

export class AgendamentoController {
  constructor() {
    this.agendamentoRepo = new PostgresAgendamentoRepository();
    this.colaboradorRepo = new PostgresColaboradorRepository();
    this.servicoRepo = new PostgresServicoRepository();
    this.horarioRepo = new PostgresHorarioRepository();
    this.salaoRepo = new PostgresSalaoRepository();
    this.calendarGateway = new GoogleCalendarGateway();
    this.notificationGateway = new TwilioWhatsAppGateway();

    this.criarAgendamentoUseCase = new CriarAgendamentoPublicoUseCase({
      agendamentoRepository: this.agendamentoRepo,
      colaboradorRepository: this.colaboradorRepo,
      servicoRepository: this.servicoRepo,
      horarioRepository: this.horarioRepo,
      salaoRepository: this.salaoRepo,
      calendarGateway: this.calendarGateway,
      notificationGateway: this.notificationGateway,
    });

    this.reagendarUseCase = new ReagendarAgendamentoUseCase({
      agendamentoRepository: this.agendamentoRepo,
      calendarGateway: this.calendarGateway,
      notificationGateway: this.notificationGateway,
    });

    this.cancelarUseCase = new CancelarAgendamentoUseCase({
      agendamentoRepository: this.agendamentoRepo,
      calendarGateway: this.calendarGateway,
      notificationGateway: this.notificationGateway,
    });

    this.registarPagamentoUseCase = new RegistarPagamentoUseCase({
      agendamentoRepository: this.agendamentoRepo,
    });

    this.obterAgendamentosEquipaUseCase = new ObterAgendamentosEquipaUseCase({
      agendamentoRepository: this.agendamentoRepo,
    });

    this.obterHistoricoUseCase = new ObterHistoricoAgendamentosUseCase({
      agendamentoRepository: this.agendamentoRepo,
    });

    this.obterEstatisticasUseCase = new ObterEstatisticasEquipaUseCase({
      agendamentoRepository: this.agendamentoRepo,
    });
  }

  async marcarPublico(req) {
    const ip = extrairIp(req);
    if (RateLimiter.isBookingRateLimited(ip)) {
      return HttpResponse.tooManyRequests();
    }

    const body = await req.json().catch(() => null);
    const parsed = marcarSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.badRequest("Dados do formulário inválidos.");
    }

    RateLimiter.registarTentativaBooking(ip);

    try {
      const resultado = await this.criarAgendamentoUseCase.execute(parsed.data);
      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async listarEquipa(req) {
    const { searchParams } = new URL(req.url);
    const colaboradorId = searchParams.get("colaboradorId") || null;
    const dataInicio = searchParams.get("start") || null;
    const dataFim = searchParams.get("end") || null;

    try {
      const eventos = await this.obterAgendamentosEquipaUseCase.execute({
        colaboradorId,
        dataInicio,
        dataFim,
      });
      return HttpResponse.ok(eventos);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async reagendar(id, req) {
    const body = await req.json().catch(() => null);
    const parsed = reagendarSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.badRequest("Dados inválidos para reagendamento.");
    }

    try {
      const atualizado = await this.reagendarUseCase.execute({
        id,
        data: parsed.data.data,
        horaInicio: parsed.data.horaInicio,
        colaboradorId: parsed.data.colaboradorId,
      });
      return HttpResponse.ok(atualizado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async cancelar(id) {
    try {
      const atualizado = await this.cancelarUseCase.execute(id);
      return HttpResponse.ok(atualizado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async registarPagamento(id, req) {
    const body = await req.json().catch(() => null);
    const parsed = pagamentoSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.badRequest("Dados inválidos de pagamento.");
    }

    try {
      const atualizado = await this.registarPagamentoUseCase.execute({
        id,
        pago: parsed.data.pago,
        metodoPagamento: parsed.data.metodoPagamento,
      });
      return HttpResponse.ok(atualizado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterHistorico(req) {
    const { searchParams } = new URL(req.url);
    const colaboradorId = searchParams.get("colaboradorId") || null;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    try {
      const resultado = await this.obterHistoricoUseCase.execute({
        colaboradorId,
        page,
        limit,
      });
      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterEstatisticas(req) {
    const { searchParams } = new URL(req.url);
    const colaboradorId = searchParams.get("colaboradorId") || null;
    const dataInicio = searchParams.get("dataInicio") || null;
    const dataFim = searchParams.get("dataFim") || null;

    try {
      const stats = await this.obterEstatisticasUseCase.execute({
        colaboradorId,
        dataInicio,
        dataFim,
      });
      return HttpResponse.ok(stats);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
