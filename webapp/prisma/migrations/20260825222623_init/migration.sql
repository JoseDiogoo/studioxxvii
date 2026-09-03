-- CreateTable
CREATE TABLE "Salao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "morada" TEXT NOT NULL,
    "telefone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" REAL NOT NULL,
    "duracaoMinutos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Servico_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "Salao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Colaborador_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "Salao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColaboradorServico" (
    "colaboradorId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,

    PRIMARY KEY ("colaboradorId", "servicoId"),
    CONSTRAINT "ColaboradorServico_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ColaboradorServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salaoId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT NOT NULL,
    CONSTRAINT "Horario_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "Salao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Horario_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "Salao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "metodoPagamento" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agendamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_email_key" ON "Colaborador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_salaoId_telefone_key" ON "Cliente"("salaoId", "telefone");

-- CreateIndex
CREATE INDEX "Agendamento_colaboradorId_data_idx" ON "Agendamento"("colaboradorId", "data");

-- CreateIndex
CREATE INDEX "Agendamento_grupoId_idx" ON "Agendamento"("grupoId");
