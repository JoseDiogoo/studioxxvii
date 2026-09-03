const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function randomPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

const SERVICOS = [
  { titulo: "Rapar Cabelo", preco: 10, duracaoMinutos: 20 },
  { titulo: "Corte Criança", preco: 13, duracaoMinutos: 30 },
  { titulo: "Corte Cabelo", preco: 15, duracaoMinutos: 30 },
  { titulo: "Corte + Lavagem", preco: 17, duracaoMinutos: 40 },
  { titulo: "Corte + Barba", preco: 22, duracaoMinutos: 45 },
  { titulo: "Rapar + Barba", preco: 18, duracaoMinutos: 40 },
  { titulo: "Corte + Barba + Lavagem", preco: 24, duracaoMinutos: 55 },
  // preço não indicado no plano original — placeholder, confirmar com o dono
  { titulo: "Corte + Sobrancelha", preco: 16, duracaoMinutos: 30 },
];

const DIAS_TERCA_A_SABADO = [2, 3, 4, 5, 6];

async function main() {
  const salao = await prisma.salao.upsert({
    where: { id: "studio-xxvii" },
    update: {},
    create: {
      id: "studio-xxvii",
      nome: "Studio XXVII",
      morada: "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça",
    },
  });

  const servicos = [];
  for (const s of SERVICOS) {
    const servico = await prisma.servico.create({
      data: { ...s, salaoId: salao.id },
    });
    servicos.push(servico);
  }

  const colaboradoresPlaceholder = [
    { nome: "Barbeiro 1", email: "barbeiro1@studioxxvii.pt" },
    { nome: "Barbeiro 2", email: "barbeiro2@studioxxvii.pt" },
  ];

  const credenciais = [];

  for (const c of colaboradoresPlaceholder) {
    const password = randomPassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const colaborador = await prisma.colaborador.create({
      data: {
        nome: c.nome,
        email: c.email,
        passwordHash,
        salaoId: salao.id,
        icsToken: crypto.randomBytes(24).toString("base64url"),
        servicos: {
          create: servicos.map((s) => ({ servicoId: s.id })),
        },
        horarios: {
          create: DIAS_TERCA_A_SABADO.map((diaSemana) => ({
            salaoId: salao.id,
            diaSemana,
            inicio: "10:00",
            fim: "19:00",
          })),
        },
      },
    });

    credenciais.push({ nome: colaborador.nome, email: colaborador.email, password });
  }

  console.log("\nSeed concluído.");
  console.log("Salao id:", salao.id);
  console.log("\nCredenciais de login geradas (guarda-as agora, não voltam a aparecer):");
  for (const cred of credenciais) {
    console.log(`  ${cred.nome} — ${cred.email} — password: ${cred.password}`);
  }
  console.log("\nMuda estas passwords assim que possível (não há UI para isso ainda).\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
