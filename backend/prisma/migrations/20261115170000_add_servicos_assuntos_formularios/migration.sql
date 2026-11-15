CREATE TYPE "TipoCampoFormulario" AS ENUM ('TEXTO', 'TEXTO_LONGO', 'NUMERO', 'DATA', 'SELECAO', 'CHECKBOX');

CREATE TABLE "servicos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "servicos_nome_key" ON "servicos"("nome");

CREATE TABLE "formularios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "formularios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "formularios_nome_key" ON "formularios"("nome");

CREATE TABLE "formulario_campos" (
    "id" SERIAL NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "rotulo" TEXT NOT NULL,
    "tipo" "TipoCampoFormulario" NOT NULL DEFAULT 'TEXTO',
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "opcoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "formulario_campos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "formulario_campos_formularioId_idx" ON "formulario_campos"("formularioId");

CREATE TABLE "assuntos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "servicoId" INTEGER NOT NULL,
    "formularioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "assuntos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assuntos_servicoId_nome_key" ON "assuntos"("servicoId", "nome");
CREATE INDEX "assuntos_formularioId_idx" ON "assuntos"("formularioId");

ALTER TABLE "formulario_campos" ADD CONSTRAINT "formulario_campos_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "formularios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assuntos" ADD CONSTRAINT "assuntos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assuntos" ADD CONSTRAINT "assuntos_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "formularios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
