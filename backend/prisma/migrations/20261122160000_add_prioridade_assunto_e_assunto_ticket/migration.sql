-- AlterTable
ALTER TABLE "assuntos" ADD COLUMN "prioridadeId" INTEGER;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "assuntoId" INTEGER;

-- CreateIndex
CREATE INDEX "assuntos_prioridadeId_idx" ON "assuntos"("prioridadeId");

-- AddForeignKey
ALTER TABLE "assuntos" ADD CONSTRAINT "assuntos_prioridadeId_fkey" FOREIGN KEY ("prioridadeId") REFERENCES "prioridades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "assuntos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
