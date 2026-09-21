import { ColaboradorController } from "@/presentation/controllers/ColaboradorController";

const controller = new ColaboradorController();

export async function GET(req, { params }) {
  const { colaboradorId, token } = await params;
  return await controller.gerarFeedIcs(colaboradorId, token);
}
