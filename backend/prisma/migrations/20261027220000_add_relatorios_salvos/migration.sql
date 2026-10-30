-- CreateTable
CREATE TABLE "relatorios_salvos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "filtros" JSONB NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_salvos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relatorios_salvos_usuarioId_idx" ON "relatorios_salvos"("usuarioId");

-- AddForeignKey
ALTER TABLE "relatorios_salvos" ADD CONSTRAINT "relatorios_salvos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
