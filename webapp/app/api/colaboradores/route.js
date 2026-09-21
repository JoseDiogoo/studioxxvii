import { ColaboradorController } from "@/presentation/controllers/ColaboradorController";

const controller = new ColaboradorController();

export async function GET() {
  return await controller.listarAtivos();
}
