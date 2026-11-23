-- AlterEnum
-- BEFORE 'SOLICITANTE' mantém a ordem igual à do enum em schema.prisma.
ALTER TYPE "PapelUsuario" ADD VALUE 'GESTOR' BEFORE 'SOLICITANTE';

-- CreateTable
CREATE TABLE "perfil_permissoes" (
    "id" SERIAL NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "permissao" TEXT NOT NULL,
    "concedida" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfil_permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_permissoes_papel_permissao_key" ON "perfil_permissoes"("papel", "permissao");
