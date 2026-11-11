import { HttpResponse } from "../http/HttpResponse";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";
import { disponibilidadeDiasSchema, disponibilidadeHorasSchema } from "../validation/schemas";
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

  // Rotas públicas que consultam a BD: 120 pedidos por minuto por IP chega para o ecrã de marcação (que atualiza de 10 em 10 s).
  _limitado(req) {
    return RateLimiter.excedeu(`disp:${RateLimiter.ipDoPedido(req)}`, 120, 60_000);
  }

  async obterDias(req) {
    if (this._limitado(req)) return HttpResponse.tooManyRequests();
    try {
      const parsed = disponibilidadeDiasSchema.safeParse(await HttpResponse.lerJson(req));
      if (!parsed.success) return HttpResponse.badRequest("Dados inválidos.");

      let { servicos, ano, mes, de } = parsed.data;

      if (!ano && de) {
        const parts = de.split("-").map(Number);
        ano = parts[0];
        mes = parts[1];
      }

      if (!ano || !mes) {
        const hoje = new Date();
        ano = hoje.getFullYear();
        mes = hoje.getMonth() + 1;
      }
      if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12 || ano < 2024 || ano > 2100) {
        return HttpResponse.badRequest("Mês inválido.");
      }

      const resultado = await this.obterDiasUseCase.execute({ servicos, ano, mes });

      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterHoras(req) {
    if (this._limitado(req)) return HttpResponse.tooManyRequests();
    try {
      const parsed = disponibilidadeHorasSchema.safeParse(await HttpResponse.lerJson(req));
      if (!parsed.success) return HttpResponse.badRequest("Dados inválidos.");

      const { servicos, data } = parsed.data;
      if (Number.isNaN(new Date(`${data}T00:00:00.000Z`).getTime())) return HttpResponse.badRequest("Data inválida.");

      const resultado = await this.obterHorasUseCase.execute({ servicos, data });

      return HttpResponse.ok(resultado);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
