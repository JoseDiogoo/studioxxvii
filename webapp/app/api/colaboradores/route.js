import { ColaboradorController } from "@/presentation/controllers/ColaboradorController";

const controller = new ColaboradorController();

export async function GET(req) {
  return await controller.listarAtivos(req);
}
