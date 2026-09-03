import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Garante que o colaborador tem um token para o feed .ics, gerando-o na primeira vez. */
export async function garantirIcsToken(colaboradorId) {
  const colaborador = await prisma.colaborador.findUnique({
    where: { id: colaboradorId },
    select: { icsToken: true },
  });
  if (colaborador?.icsToken) return colaborador.icsToken;

  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.colaborador.update({ where: { id: colaboradorId }, data: { icsToken: token } });
  return token;
}
