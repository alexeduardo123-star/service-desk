-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "resetTokenHash" TEXT,
ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3);
