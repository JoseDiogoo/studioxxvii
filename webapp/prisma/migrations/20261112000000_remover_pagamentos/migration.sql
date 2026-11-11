-- Sem registo de pagamentos: o sistema é só agendador/calendário.
-- AlterTable
ALTER TABLE "Agendamento" DROP COLUMN "pago",
DROP COLUMN "metodoPagamento";

-- DropEnum
DROP TYPE "MetodoPagamento";
