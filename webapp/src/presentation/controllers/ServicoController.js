import { HttpResponse } from "../http/HttpResponse";
import { PostgresServicoRepository } from "@/infrastructure/database/repositories/PostgresServicoRepository";
import { ListarServicosAtivosUseCase } from "@/application/use-cases/servico/ListarServicosAtivosUseCase";

export class ServicoController {
  constructor() {
    this.servicoRepo = new PostgresServicoRepository();
    this.listarServicosUseCase = new ListarServicosAtivosUseCase({
      servicoRepository: this.servicoRepo,
    });
  }

  async listarAtivos() {
    try {
      const servicos = (await this.listarServicosUseCase.execute()).map(
        ({ id, titulo, descricao, preco, duracaoMinutos }) => ({ id, titulo, descricao, preco, duracaoMinutos })
      );
      return HttpResponse.ok({ servicos });
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
