import { HttpResponse } from "../http/HttpResponse";
import { perfilSchema } from "../validation/schemas";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";
import { PostgresAgendamentoRepository } from "@/infrastructure/database/repositories/PostgresAgendamentoRepository";
import { PostgresHorarioRepository } from "@/infrastructure/database/repositories/PostgresHorarioRepository";
import { BcryptPasswordHasher } from "@/infrastructure/gateways/BcryptPasswordHasher";
import { ObterPerfilColaboradorUseCase } from "@/application/use-cases/colaborador/ObterPerfilColaboradorUseCase";
import { AtualizarPerfilColaboradorUseCase } from "@/application/use-cases/colaborador/AtualizarPerfilColaboradorUseCase";
import { GerarFeedIcsUseCase } from "@/application/use-cases/colaborador/GerarFeedIcsUseCase";

export class ColaboradorController {
  constructor() {
    this.colaboradorRepo = new PostgresColaboradorRepository();
    this.agendamentoRepo = new PostgresAgendamentoRepository();
    this.horarioRepo = new PostgresHorarioRepository();
    this.hasher = new BcryptPasswordHasher();

    this.obterPerfilUseCase = new ObterPerfilColaboradorUseCase({
      colaboradorRepository: this.colaboradorRepo,
    });

    this.atualizarPerfilUseCase = new AtualizarPerfilColaboradorUseCase({
      colaboradorRepository: this.colaboradorRepo,
      passwordHasher: this.hasher,
    });

    this.gerarFeedIcsUseCase = new GerarFeedIcsUseCase({
      colaboradorRepository: this.colaboradorRepo,
      agendamentoRepository: this.agendamentoRepo,
    });
  }

  async listarAtivos(req) {
    try {
      const url = req?.url ? new URL(req.url) : null;
      const servicoId = url?.searchParams?.get("servicoId");

      if (servicoId) {
        const rels = await this.colaboradorRepo.findElegiveisPorServico(servicoId);
        const colaboradores = rels.map((r) => r.colaborador || { id: r.colaboradorId });
        return HttpResponse.ok({ colaboradores });
      }

      const colaboradores = await this.colaboradorRepo.findAtivos();
      return HttpResponse.ok({ colaboradores });
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterPerfil(colaboradorId) {
    try {
      const perfil = await this.obterPerfilUseCase.execute(colaboradorId);
      return HttpResponse.ok(perfil);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async atualizarPerfil(colaboradorId, req) {
    const body = await req.json().catch(() => null);
    const parsed = perfilSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.badRequest("Dados inválidos de perfil.");
    }

    try {
      await this.atualizarPerfilUseCase.execute({
        colaboradorId,
        nome: parsed.data.nome,
        passwordAtual: parsed.data.passwordAtual,
        novaPassword: parsed.data.novaPassword,
      });
      return HttpResponse.ok({ ok: true });
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async obterDisponibilidadeSemana(req) {
    const { searchParams } = new URL(req.url);
    const colaboradorId = searchParams.get("colaboradorId");
    if (!colaboradorId) return HttpResponse.badRequest("colaboradorId é obrigatório.");

    try {
      const horarios = await this.horarioRepo.findByColaboradorId(colaboradorId);
      return HttpResponse.ok(horarios);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }

  async gerarFeedIcs(colaboradorId, token) {
    try {
      const icsConteudo = await this.gerarFeedIcsUseCase.execute({ colaboradorId, token });
      return new Response(icsConteudo, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="studioxxvii-${colaboradorId}.ics"`,
        },
      });
    } catch (err) {
      return HttpResponse.notFound("Feed não encontrado.");
    }
  }
}
