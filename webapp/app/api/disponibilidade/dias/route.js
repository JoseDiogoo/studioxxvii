import { DisponibilidadeController } from "@/presentation/controllers/DisponibilidadeController";

const controller = new DisponibilidadeController();

export async function POST(req) {
  return await controller.obterDias(req);
}
