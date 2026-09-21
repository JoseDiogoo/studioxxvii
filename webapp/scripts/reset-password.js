const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const NOVA_PASSWORD = "Studio2026!";

async function main() {
  const hash = await bcrypt.hash(NOVA_PASSWORD, 12);
  const r = await prisma.colaborador.updateMany({ data: { passwordHash: hash } });
  const lista = await prisma.colaborador.findMany({ select: { nome: true, email: true } });
  console.log(`\nPassword redefinida para ${r.count} colaborador(es): "${NOVA_PASSWORD}"\n`);
  console.log("Podes entrar em /equipa/login com qualquer um destes emails:");
  lista.forEach((c) => console.log(`  - ${c.email} (${c.nome})`));
}

main().finally(() => prisma.$disconnect());
