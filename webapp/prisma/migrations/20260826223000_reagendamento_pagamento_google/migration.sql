-- AlterTable
ALTER TABLE "Colaborador" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Colaborador" ADD COLUMN "icsToken" TEXT;

-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN "referenciaPagamento" TEXT;
ALTER TABLE "Agendamento" ADD COLUMN "googleEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_icsToken_key" ON "Colaborador"("icsToken");
