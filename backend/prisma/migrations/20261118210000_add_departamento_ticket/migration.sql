-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "departamentoId" INTEGER;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
