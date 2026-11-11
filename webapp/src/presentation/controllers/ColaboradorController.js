import { HttpResponse } from "../http/HttpResponse";
import { PostgresColaboradorRepository } from "@/infrastructure/database/repositories/PostgresColaboradorRepository";

export class ColaboradorController {
  constructor() {
    this.colaboradorRepo = new PostgresColaboradorRepository();
  }

  async listarAtivos(req) {
    try {
      const url = req?.url ? new URL(req.url) : null;
      const servicoId = url?.searchParams?.get("servicoId");

      if (servicoId) {
        const rels = await this.colaboradorRepo.findElegiveisPorServico(servicoId);
        const colaboradores = rels.map((r) => ({ id: r.colaborador?.id ?? r.colaboradorId, nome: r.colaborador?.nome }));
        return HttpResponse.ok({ colaboradores });
      }

      // Rota pública: só o que o cliente precisa ver. O email é o login da equipa e nunca sai daqui.
      const colaboradores = (await this.colaboradorRepo.findAtivos()).map(({ id, nome }) => ({ id, nome }));
      return HttpResponse.ok({ colaboradores });
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
