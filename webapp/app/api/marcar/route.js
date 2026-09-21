import { AgendamentoController } from "@/presentation/controllers/AgendamentoController";

const controller = new AgendamentoController();

export async function POST(req) {
  return await controller.marcarPublico(req);
}
