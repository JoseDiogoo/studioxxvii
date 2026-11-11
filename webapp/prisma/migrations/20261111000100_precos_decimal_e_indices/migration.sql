-- AlterTable
ALTER TABLE "Servico" ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Agendamento" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_idx" ON "Agendamento"("clienteId");

-- CreateIndex
CREATE INDEX "Agendamento_data_idx" ON "Agendamento"("data");
