import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const departamentoTI = await prisma.departamento.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: "TI", descricao: "Tecnologia da Informação" },
  });
  const departamentoFinanceiro = await prisma.departamento.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nome: "Financeiro", descricao: "Setor financeiro" },
  });

  const categoriaHardware = await prisma.categoria.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: "Hardware", descricao: "Problemas com equipamentos físicos" },
  });
  await prisma.categoria.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nome: "Software", descricao: "Problemas com sistemas e aplicativos" },
  });
  await prisma.categoria.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, nome: "Rede", descricao: "Conectividade e acesso à rede" },
  });

  await prisma.prioridade.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: "Baixa", nivel: 1, slaHoras: 72 },
  });
  const prioridadeMedia = await prisma.prioridade.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nome: "Média", nivel: 2, slaHoras: 24 },
  });
  await prisma.prioridade.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, nome: "Alta", nivel: 3, slaHoras: 8 },
  });
  await prisma.prioridade.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, nome: "Urgente", nivel: 4, slaHoras: 2 },
  });

  const senhaHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@servicedesk.com" },
    update: {},
    create: { nome: "Administrador", email: "admin@servicedesk.com", senhaHash, papel: "ADMIN", departamentoId: departamentoTI.id },
  });
  const tecnico = await prisma.usuario.upsert({
    where: { email: "tecnico@servicedesk.com" },
    update: {},
    create: { nome: "Técnico Suporte", email: "tecnico@servicedesk.com", senhaHash, papel: "TECNICO", departamentoId: departamentoTI.id },
  });
  const solicitante = await prisma.usuario.upsert({
    where: { email: "usuario@servicedesk.com" },
    update: {},
    create: { nome: "Usuário Solicitante", email: "usuario@servicedesk.com", senhaHash, papel: "SOLICITANTE", departamentoId: departamentoFinanceiro.id },
  });

  const equipamento = await prisma.equipamento.upsert({
    where: { numeroSerie: "NB-0001" },
    update: {},
    create: { nome: "Notebook Dell Latitude", tipo: "Notebook", numeroSerie: "NB-0001", usuarioId: solicitante.id, departamentoId: departamentoFinanceiro.id },
  });

  await prisma.ticket.create({
    data: {
      titulo: "Notebook não liga",
      descricao: "Ao pressionar o botão de energia nada acontece.",
      solicitanteId: solicitante.id,
      categoriaId: categoriaHardware.id,
      prioridadeId: prioridadeMedia.id,
      equipamentoId: equipamento.id,
    },
  });

  await prisma.baseConhecimento.create({
    data: {
      titulo: "Como resetar a senha de rede",
      conteudo: "Acesse o portal interno, clique em 'Esqueci minha senha' e siga as instruções enviadas por email.",
      categoriaId: categoriaHardware.id,
      autorId: tecnico.id,
    },
  });

  // Ids foram fixados manualmente acima (upsert por id) para dados de
  // referência estáveis; realinha as sequences do Postgres para que os
  // próximos INSERTs (feitos pela API) não colidam com esses ids.
  for (const tabela of ["departamentos", "categorias", "prioridades"]) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${tabela}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabela}), 1))`
    );
  }

  console.log("Seed concluído. Usuários de teste (senha para todos: 123456):");
  console.log(`  ADMIN:       ${admin.email}`);
  console.log(`  TECNICO:     ${tecnico.email}`);
  console.log(`  SOLICITANTE: ${solicitante.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
