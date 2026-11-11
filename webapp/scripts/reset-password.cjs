// Uso: node scripts/reset-password.cjs <email> <nova-password>
// Define a password de UM colaborador (nunca de todos). A password não fica guardada em nenhum ficheiro.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const [email, password] = process.argv.slice(2);

async function main() {
  if (!email || !password || password.length < 10) {
    console.error("Uso: node scripts/reset-password.cjs <email> <nova-password com 10+ caracteres>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const r = await prisma.colaborador.updateMany({ where: { email: email.trim().toLowerCase() }, data: { passwordHash: hash } });
  console.log(r.count === 1 ? "Password atualizada." : "Nenhum colaborador com esse email.");
}

main().finally(() => prisma.$disconnect());
