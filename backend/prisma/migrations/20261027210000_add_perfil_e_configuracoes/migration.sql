-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "configuracoes_usuario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "itensPorPagina" INTEGER NOT NULL DEFAULT 10,
    "fusoHorario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "notificarEmail" BOOLEAN NOT NULL DEFAULT false,
    "notificarNovoTicket" BOOLEAN NOT NULL DEFAULT true,
    "notificarAtribuicao" BOOLEAN NOT NULL DEFAULT true,
    "notificarStatus" BOOLEAN NOT NULL DEFAULT true,
    "notificarComentario" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_usuario_usuarioId_key" ON "configuracoes_usuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "configuracoes_usuario" ADD CONSTRAINT "configuracoes_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
