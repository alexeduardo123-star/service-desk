CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "contato" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

CREATE TABLE "contratos_manutencao" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    "equipamentoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contratos_manutencao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contratos_manutencao_fornecedorId_idx" ON "contratos_manutencao"("fornecedorId");
CREATE INDEX "contratos_manutencao_equipamentoId_idx" ON "contratos_manutencao"("equipamentoId");
ALTER TABLE "contratos_manutencao" ADD CONSTRAINT "contratos_manutencao_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contratos_manutencao" ADD CONSTRAINT "contratos_manutencao_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
