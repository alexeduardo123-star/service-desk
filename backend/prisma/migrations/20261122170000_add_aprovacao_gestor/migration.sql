-- CreateEnum
CREATE TYPE "StatusAprovacao" AS ENUM ('NAO_EXIGIDA', 'PENDENTE', 'APROVADA', 'REJEITADA');

-- AlterEnum
ALTER TYPE "TipoNotificacao" ADD VALUE 'TICKET_APROVACAO' BEFORE 'SISTEMA';

-- AlterTable
ALTER TABLE "categorias" ADD COLUMN "exigeAprovacao" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "aprovacaoStatus" "StatusAprovacao" NOT NULL DEFAULT 'NAO_EXIGIDA',
ADD COLUMN "aprovadorId" INTEGER,
ADD COLUMN "aprovacaoEm" TIMESTAMP(3),
ADD COLUMN "aprovacaoMotivo" TEXT;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
