-- CreateTable
CREATE TABLE "ticket_colaboradores" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "adicionadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_colaboradores_usuarioId_idx" ON "ticket_colaboradores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_colaboradores_ticketId_usuarioId_key" ON "ticket_colaboradores"("ticketId", "usuarioId");

-- AddForeignKey
ALTER TABLE "ticket_colaboradores" ADD CONSTRAINT "ticket_colaboradores_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_colaboradores" ADD CONSTRAINT "ticket_colaboradores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_colaboradores" ADD CONSTRAINT "ticket_colaboradores_adicionadoPorId_fkey" FOREIGN KEY ("adicionadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

