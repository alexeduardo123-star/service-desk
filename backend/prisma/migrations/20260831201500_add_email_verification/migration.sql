-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verificacaoTokenHash" TEXT,
ADD COLUMN     "verificacaoTokenExpiresAt" TIMESTAMP(3);
