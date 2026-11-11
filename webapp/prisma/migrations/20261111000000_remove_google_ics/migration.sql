-- DropIndex
DROP INDEX "Colaborador_icsToken_key";

-- AlterTable
ALTER TABLE "Agendamento" DROP COLUMN "googleEventId";

-- AlterTable
ALTER TABLE "Colaborador" DROP COLUMN "googleRefreshToken",
DROP COLUMN "icsToken";
