import { SalaoController } from "@/presentation/controllers/SalaoController";

const controller = new SalaoController();

export async function GET() {
  return await controller.obterInfo();
}
