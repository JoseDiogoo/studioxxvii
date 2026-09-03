import { prisma } from "@/lib/prisma";

let cachedId = null;

export async function getSalaoId() {
  if (cachedId) return cachedId;
  const salao = await prisma.salao.findFirstOrThrow();
  cachedId = salao.id;
  return cachedId;
}
