import { HttpResponse } from "../http/HttpResponse";
import { marcarSchema } from "../validation/schemas";
import { log, mascararTelefone } from "@/infrastructure/logger";
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
      log("aviso", "seguranca", "marcações bloqueadas por excesso de pedidos", { ip });
      return HttpResponse.tooManyRequests();
    }

    const body = await HttpResponse.lerJson(req);
    const parsed = marcarSchema.safeParse(body);
    if (!parsed.success) {
      log("aviso", "marcacao", "formulário inválido", { ip, campos: parsed.error.issues.map((i) => i.path.join(".")) });
      return HttpResponse.badRequest("Dados do formulário inválidos.");
    }

    RateLimiter.registarTentativaBooking(ip);

    try {
      const resultado = await this.criarAgendamentoUseCase.execute(parsed.data);
      if (parsed.data.empresaSite) {
        log("aviso", "seguranca", "marcação ignorada: campo escondido preenchido (robô)", { ip });
      } else {
        log("info", "marcacao", "marcação criada", {
          grupoId: resultado.grupoId,
          data: resultado.data,
          hora: resultado.horaInicio,
          total: resultado.total,
          servicos: parsed.data.servicos.length,
          telefone: mascararTelefone(parsed.data.cliente.telefone),
        });
      }
      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
