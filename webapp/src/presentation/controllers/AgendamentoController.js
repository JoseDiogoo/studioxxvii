import { HttpResponse } from "../http/HttpResponse";
import { marcarSchema } from "../validation/schemas";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { PostgresServicoRepository } from "@/infrastructure/database/repositories/PostgresServicoRepository";
import { PostgresHorarioRepository } from "@/infrastructure/database/repositories/PostgresHorarioRepository";
import { PostgresSalaoRepository } from "@/infrastructure/database/repositories/PostgresSalaoRepository";
import { TwilioWhatsAppGateway } from "@/infrastructure/gateways/TwilioWhatsAppGateway";

import { CriarAgendamentoPublicoUseCase } from "@/application/use-cases/agendamento/CriarAgendamentoPublicoUseCase";

export class AgendamentoController {
  constructor() {
    this.agendamentoRepo = new PostgresAgendamentoRepository();
    this.colaboradorRepo = new PostgresColaboradorRepository();
    this.servicoRepo = new PostgresServicoRepository();
    this.horarioRepo = new PostgresHorarioRepository();
    this.salaoRepo = new PostgresSalaoRepository();
    this.notificationGateway = new TwilioWhatsAppGateway();

    this.criarAgendamentoUseCase = new CriarAgendamentoPublicoUseCase({
      agendamentoRepository: this.agendamentoRepo,
      colaboradorRepository: this.colaboradorRepo,
      servicoRepository: this.servicoRepo,
      horarioRepository: this.horarioRepo,
      salaoRepository: this.salaoRepo,
      notificationGateway: this.notificationGateway,
    });
  }

  async marcarPublico(req) {
    const ip = RateLimiter.ipDoPedido(req);
    if (RateLimiter.isBookingRateLimited(ip)) {
      console.warn(`[seguranca] marcações bloqueadas por excesso de pedidos (ip ${ip})`);
      return HttpResponse.tooManyRequests();
    }

    const body = await HttpResponse.lerJson(req);
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
}
