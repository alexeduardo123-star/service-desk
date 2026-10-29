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

  // Ticket e artigo não têm campo único para upsert; só cria na primeira
  // execução para o seed poder rodar de novo sem duplicar.
  if ((await prisma.ticket.count()) === 0) {
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
  }

  if ((await prisma.baseConhecimento.count()) === 0) {
    await prisma.baseConhecimento.create({
      data: {
        titulo: "Como resetar a senha de rede",
        conteudo: "Acesse o portal interno, clique em 'Esqueci minha senha' e siga as instruções enviadas por email.",
        categoriaId: categoriaHardware.id,
        autorId: tecnico.id,
      },
    });
  }

  // Dados de demonstração para o dashboard e os relatórios terem o que mostrar:
  // ~36 chamados espalhados pelos últimos 30 dias. Gerador pseudoaleatório com
  // semente fixa para o resultado ser sempre o mesmo, e só roda se o banco
  // ainda tem poucos chamados (não duplica em seeds seguintes).
  if ((await prisma.ticket.count()) < 5) {
    const tecnicoRedes = await prisma.usuario.upsert({
      where: { email: "redes@servicedesk.com" },
      update: {},
      create: { nome: "Técnico Redes", email: "redes@servicedesk.com", senhaHash, papel: "TECNICO", departamentoId: departamentoTI.id },
    });
    const solicitanteRh = await prisma.usuario.upsert({
      where: { email: "rh@servicedesk.com" },
      update: {},
      create: { nome: "Maria do RH", email: "rh@servicedesk.com", senhaHash, papel: "SOLICITANTE", departamentoId: departamentoFinanceiro.id },
    });

    const categorias = await prisma.categoria.findMany();
    const prioridades = await prisma.prioridade.findMany();
    const tecnicos = [tecnico, tecnicoRedes];
    const solicitantes = [solicitante, solicitanteRh];

    const TITULOS = {
      Hardware: ["Monitor sem imagem", "Teclado com teclas travando", "Impressora não imprime", "Mouse não funciona", "Computador reiniciando sozinho"],
      Software: ["Erro ao abrir o ERP", "Office pede ativação", "Antivírus bloqueando sistema", "Instalar leitor de PDF", "Sistema de ponto fora do ar"],
      Rede: ["Sem acesso à internet", "Wi-Fi caindo toda hora", "VPN não conecta", "Pasta de rede inacessível", "Ponto de rede sem sinal"],
    };

    let semente = 42;
    const aleatorio = () => {
      semente = (semente * 1664525 + 1013904223) % 4294967296;
      return semente / 4294967296;
    };
    const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];

    const HORA = 60 * 60 * 1000;
    const agora = Date.now();

    for (let i = 0; i < 36; i++) {
      const categoria = sortear(categorias);
      const prioridade = sortear(prioridades);
      const diasAtras = Math.floor(aleatorio() * 30);
      const criadoEm = new Date(agora - diasAtras * 24 * HORA - Math.floor(aleatorio() * 10 * HORA));

      // Chamados antigos tendem a estar fechados; os recentes ficam abertos/em andamento.
      const sorteio = aleatorio();
      let status = "ABERTO";
      if (diasAtras > 3) status = sorteio < 0.7 ? "FECHADO" : sorteio < 0.9 ? "EM_ANDAMENTO" : "ABERTO";
      else status = sorteio < 0.25 ? "FECHADO" : sorteio < 0.65 ? "EM_ANDAMENTO" : "ABERTO";

      let fechadoEm = null;
      if (status === "FECHADO") {
        // Tempo de resolução entre 30% e 160% do SLA: alguns estouram o prazo.
        fechadoEm = new Date(criadoEm.getTime() + prioridade.slaHoras * HORA * (0.3 + aleatorio() * 1.3));
        if (fechadoEm.getTime() > agora) {
          status = "EM_ANDAMENTO";
          fechadoEm = null;
        }
      }

      const tecnicoDoChamado = status === "ABERTO" ? null : sortear(tecnicos);
      const solicitanteDoChamado = sortear(solicitantes);
      const titulo = sortear(TITULOS[categoria.nome] ?? TITULOS.Software);

      const ticket = await prisma.ticket.create({
        data: {
          titulo,
          descricao: `${titulo}. Chamado de demonstração gerado pelo seed.`,
          status,
          solicitanteId: solicitanteDoChamado.id,
          tecnicoId: tecnicoDoChamado?.id ?? null,
          categoriaId: categoria.id,
          prioridadeId: prioridade.id,
          createdAt: criadoEm,
          closedAt: fechadoEm,
        },
      });

      if (tecnicoDoChamado) {
        await prisma.comentario.createMany({
          data: [
            { ticketId: ticket.id, usuarioId: tecnicoDoChamado.id, mensagem: "Chamado assumido, estou analisando.", createdAt: new Date(criadoEm.getTime() + HORA) },
            { ticketId: ticket.id, usuarioId: solicitanteDoChamado.id, mensagem: "Obrigado, fico no aguardo.", createdAt: new Date(criadoEm.getTime() + 2 * HORA) },
          ],
        });
      }
    }
  }

  if ((await prisma.notificacao.count()) === 0) {
    await prisma.notificacao.createMany({
      data: [admin, tecnico, solicitante].map((u) => ({
        usuarioId: u.id,
        tipo: "SISTEMA",
        titulo: "Bem-vindo ao Service Desk",
        mensagem: "Aqui você acompanha avisos sobre os seus chamados. Ajuste o que quer receber em Configurações.",
      })),
    });
  }

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
  console.log(`  (demo)       redes@servicedesk.com e rh@servicedesk.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
