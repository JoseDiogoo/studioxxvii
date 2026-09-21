const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Studio2026!";

const SERVICOS = [
  { titulo: "Rapar Cabelo", preco: 10, duracaoMinutos: 20 },
  { titulo: "Corte Criança", preco: 13, duracaoMinutos: 30 },
  { titulo: "Corte Cabelo", preco: 15, duracaoMinutos: 30 },
  { titulo: "Corte + Lavagem", preco: 17, duracaoMinutos: 40 },
  { titulo: "Corte + Barba", preco: 22, duracaoMinutos: 45 },
  { titulo: "Rapar + Barba", preco: 18, duracaoMinutos: 40 },
  { titulo: "Corte + Barba + Lavagem", preco: 24, duracaoMinutos: 55 },
  { titulo: "Corte + Sobrancelha", preco: 16, duracaoMinutos: 30 },
];

const DIAS_TERCA_A_SABADO = [2, 3, 4, 5, 6];

async function main() {
  console.log("A inicializar seed idempotent no PostgreSQL...");

  // 1. Upsert Salão
  const salao = await prisma.salao.upsert({
    where: { id: "studio-xxvii" },
    update: {
      nome: "Studio XXVII",
      morada: "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça",
    },
    create: {
      id: "studio-xxvii",
      nome: "Studio XXVII",
      morada: "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça",
    },
  });

  // 2. Upsert Serviços
  const servicos = [];
  for (const s of SERVICOS) {
    let servico = await prisma.servico.findFirst({
      where: { salaoId: salao.id, titulo: s.titulo },
    });

    if (servico) {
      servico = await prisma.servico.update({
        where: { id: servico.id },
        data: { preco: s.preco, duracaoMinutos: s.duracaoMinutos, ativo: true },
      });
    } else {
      servico = await prisma.servico.create({
        data: { ...s, salaoId: salao.id },
      });
    }
    servicos.push(servico);
  }

  // 3. Upsert Colaboradores
  const colaboradoresPlaceholder = [
    { nome: "Barbeiro 1", email: "barbeiro1@studioxxvii.pt" },
    { nome: "Barbeiro 2", email: "barbeiro2@studioxxvii.pt" },
  ];

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const c of colaboradoresPlaceholder) {
    const colaborador = await prisma.colaborador.upsert({
      where: { email: c.email },
      update: {
        nome: c.nome,
        passwordHash,
        salaoId: salao.id,
        ativo: true,
      },
      create: {
        nome: c.nome,
        email: c.email,
        passwordHash,
        salaoId: salao.id,
        icsToken: crypto.randomBytes(24).toString("base64url"),
      },
    });

    // Associar todos os serviços ao colaborador
    for (const s of servicos) {
      await prisma.colaboradorServico.upsert({
        where: {
          colaboradorId_servicoId: {
            colaboradorId: colaborador.id,
            servicoId: s.id,
          },
        },
        update: {},
        create: {
          colaboradorId: colaborador.id,
          servicoId: s.id,
        },
      });
    }

    // Associar horários Terça a Sábado
    await prisma.horario.deleteMany({
      where: { colaboradorId: colaborador.id },
    });

    for (const diaSemana of DIAS_TERCA_A_SABADO) {
      await prisma.horario.create({
        data: {
          salaoId: salao.id,
          colaboradorId: colaborador.id,
          diaSemana,
          inicio: "10:00",
          fim: "19:00",
        },
      });
    }
  }

  console.log("\n✅ Seed concluído com sucesso no PostgreSQL!");
  console.log("Salão:", salao.nome);
  console.log("Serviços registados:", servicos.length);
  console.log("\n🔑 Credenciais de login configuradas:");
  for (const c of colaboradoresPlaceholder) {
    console.log(`  - Email: ${c.email} | Password: ${DEFAULT_PASSWORD}`);
  }
  console.log("\nPodes entrar diretamente em http://localhost:3000/equipa/login com estas contas.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
