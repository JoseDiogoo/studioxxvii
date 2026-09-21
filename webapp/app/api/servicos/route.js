import { ServicoController } from "@/presentation/controllers/ServicoController";

const controller = new ServicoController();

export async function GET() {
  return await controller.listarAtivos();
}
