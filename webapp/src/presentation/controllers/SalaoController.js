import { HttpResponse } from "../http/HttpResponse";
import { PostgresSalaoRepository } from "@/infrastructure/database/repositories/PostgresSalaoRepository";
import { ObterDetalhesSalaoUseCase } from "@/application/use-cases/salao/ObterDetalhesSalaoUseCase";

export class SalaoController {
  constructor() {
    this.salaoRepo = new PostgresSalaoRepository();
    this.obterSalaoUseCase = new ObterDetalhesSalaoUseCase({
      salaoRepository: this.salaoRepo,
    });
  }

  async obterInfo() {
    try {
      const salao = await this.obterSalaoUseCase.execute();
      return HttpResponse.ok(salao);
    } catch (err) {
      return HttpResponse.tratarErro(err);
    }
  }
}
