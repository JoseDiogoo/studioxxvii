import { HttpResponse } from "../http/HttpResponse";
import { PostgresServicoRepository } from "@/infrastructure/database/repositories/PostgresServicoRepository";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { PostgresHorarioRepository } from "@/infrastructure/database/repositories/PostgresHorarioRepository";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { ObterDiasDisponiveisUseCase } from "@/application/use-cases/disponibilidade/ObterDiasDisponiveisUseCase";
import { ObterHorasDisponiveisUseCase } from "@/application/use-cases/disponibilidade/ObterHorasDisponiveisUseCase";

export class DisponibilidadeController {
  constructor() {
    const servicoRepo = new PostgresServicoRepository();
    const colaboradorRepo = new PostgresColaboradorRepository();
    const horarioRepo = new PostgresHorarioRepository();
    const agendamentoRepo = new PostgresAgendamentoRepository();

    this.obterDiasUseCase = new ObterDiasDisponiveisUseCase({
      servicoRepository: servicoRepo,
      colaboradorRepository: colaboradorRepo,
      horarioRepository: horarioRepo,
      agendamentoRepository: agendamentoRepo,
    });

    this.obterHorasUseCase = new ObterHorasDisponiveisUseCase({
      servicoRepository: servicoRepo,
      colaboradorRepository: colaboradorRepo,
      horarioRepository: horarioRepo,
      agendamentoRepository: agendamentoRepo,
    });
  }

  async obterDias(req) {
    try {
      const body = await req.json().catch(() => null);
      if (!body) return HttpResponse.badRequest("JSON inválido.");

      const { servicos, ano, mes } = body;
      if (!ano || !mes) return HttpResponse.badRequest("ano e mes são obrigatórios.");

      const resultado = await this.obterDiasUseCase.execute({
        servicos,
        ano: Number(ano),
        mes: Number(mes),
      });

      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterHoras(req) {
    try {
      const body = await req.json().catch(() => null);
      if (!body) return HttpResponse.badRequest("JSON inválido.");

      const { servicos, data } = body;
      if (!data) return HttpResponse.badRequest("data é obrigatória.");

      const resultado = await this.obterHorasUseCase.execute({
        servicos,
        data,
      });

      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
