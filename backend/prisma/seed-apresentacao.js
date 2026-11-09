// Gera um histórico realista para a apresentação: usuários, equipamentos,
// chamados (com comentários e notificações), fornecedores e contratos.
//
//   npm run seed:apresentacao
//
// Só ADICIONA dados (não apaga nada). Cada parte tem a sua trava: se já foi
// gerada naquele banco, é pulada, então o script pode rodar de novo sem
// duplicar. Usa um gerador pseudoaleatório com semente fixa: o resultado é
// sempre o mesmo. Senha de todos os usuários criados: 123456.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MARCADOR_EMAIL = "ana.souza@servicedesk.com";
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const AGORA = Date.now();

let semente = 2026;
const aleatorio = () => {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
};
const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];
const entre = (min, max) => min + aleatorio() * (max - min);

// Horário comercial (8h–18h) num dia útil, `diasAtras` dias antes de hoje.
function horarioComercial(diasAtras) {
  const d = new Date(AGORA - diasAtras * DIA);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  d.setHours(8 + Math.floor(aleatorio() * 10), Math.floor(aleatorio() * 60), 0, 0);
  return d;
}

const DEPARTAMENTOS = [
  ["TI", "Tecnologia da Informação"],
  ["Financeiro", "Setor financeiro"],
  ["RH", "Recursos Humanos"],
  ["Comercial", "Vendas e relacionamento com clientes"],
  ["Logística", "Estoque, expedição e transporte"],
  ["Diretoria", "Diretoria e administração"],
];

// [nome, email, papel, cargo, departamento, diasDesdeEntrada, ativo]
const USUARIOS = [
  ["Patrícia Mendes", "patricia.mendes", "ADMIN", "Coordenadora de TI", "TI", 180, true],
  ["Rafael Lima", "rafael.lima", "TECNICO", "Analista de Suporte N1", "TI", 170, true],
  ["Juliana Costa", "juliana.costa", "TECNICO", "Analista de Redes e Infraestrutura", "TI", 160, true],
  ["Bruno Almeida", "bruno.almeida", "TECNICO", "Analista de Sistemas", "TI", 95, true],
  ["Ana Souza", "ana.souza", "SOLICITANTE", "Analista Financeira", "Financeiro", 150, true],
  ["Carlos Pereira", "carlos.pereira", "SOLICITANTE", "Contador", "Financeiro", 140, true],
  ["Fernanda Oliveira", "fernanda.oliveira", "SOLICITANTE", "Analista de RH", "RH", 130, true],
  ["Beatriz Carvalho", "beatriz.carvalho", "SOLICITANTE", "Recrutadora", "RH", 60, true],
  ["Lucas Martins", "lucas.martins", "SOLICITANTE", "Vendedor Interno", "Comercial", 120, true],
  ["Mariana Rocha", "mariana.rocha", "SOLICITANTE", "Gerente Comercial", "Comercial", 175, true],
  ["Thiago Ribeiro", "thiago.ribeiro", "SOLICITANTE", "Representante Comercial", "Comercial", 45, true],
  ["Pedro Santos", "pedro.santos", "SOLICITANTE", "Supervisor de Logística", "Logística", 110, true],
  ["Camila Ferreira", "camila.ferreira", "SOLICITANTE", "Assistente de Logística", "Logística", 100, true],
  ["Roberto Nunes", "roberto.nunes", "SOLICITANTE", "Diretor Administrativo", "Diretoria", 180, true],
  ["Larissa Gomes", "larissa.gomes", "SOLICITANTE", "Assistente Administrativa", "Diretoria", 85, true],
  ["Eduardo Barros", "eduardo.barros", "SOLICITANTE", "Vendedor Externo (desligado)", "Comercial", 165, false],
];

// Cenários de chamado. `conversa` é a troca de mensagens até a solução;
// T = técnico, S = solicitante. `solucao` é o último comentário do técnico.
const CENARIOS = [
  { cat: "Hardware", pri: "Média", equip: "Notebook", titulo: "Notebook não liga",
    descricao: "Ao apertar o botão de energia o notebook não dá sinal nenhum. Ontem estava funcionando normalmente.",
    conversa: [["T", "Olá! Pode testar com o carregador conectado e me dizer se o LED de carga acende?"], ["S", "Com o carregador o LED fica laranja, mas a tela continua apagada."], ["T", "Vou passar na sua mesa para fazer um reset de energia (bateria e CMOS)."]],
    solucao: "Feito o reset de energia e atualizada a BIOS. Notebook ligando normalmente. Qualquer coisa é só reabrir o chamado." },
  { cat: "Hardware", pri: "Baixa", equip: "Monitor", titulo: "Monitor piscando",
    descricao: "O monitor fica piscando a cada poucos minutos, principalmente depois do almoço.",
    conversa: [["T", "Consegue verificar se o cabo HDMI está bem encaixado nos dois lados?"], ["S", "Encaixei de novo mas continuou piscando."]],
    solucao: "Cabo HDMI substituído por um novo. Problema resolvido." },
  { cat: "Hardware", pri: "Alta", equip: "Impressora", titulo: "Impressora do setor não imprime",
    descricao: "A impressora do setor parou de imprimir. Os documentos ficam presos na fila de impressão.",
    conversa: [["T", "Estou verificando o servidor de impressão, a fila parece travada."], ["S", "Temos notas fiscais para imprimir ainda hoje, consegue priorizar?"], ["T", "Sim, já estou nisso."]],
    solucao: "Spooler reiniciado e driver reinstalado. A fila foi liberada e a impressora voltou a funcionar." },
  { cat: "Hardware", pri: "Baixa", equip: null, titulo: "Teclado com teclas falhando",
    descricao: "Algumas teclas (A, S e espaço) precisam ser pressionadas várias vezes para funcionar.",
    conversa: [["T", "Vou separar um teclado novo do estoque para você."]],
    solucao: "Teclado substituído. O antigo foi encaminhado para descarte." },
  { cat: "Hardware", pri: "Média", equip: "Desktop", titulo: "Computador reiniciando sozinho",
    descricao: "O computador reinicia sozinho várias vezes por dia, e acabo perdendo o que estava fazendo.",
    conversa: [["T", "Vou analisar os logs do sistema remotamente, pode deixar o computador ligado?"], ["S", "Claro, está ligado."], ["T", "Encontrei erros de superaquecimento. Vou passar aí para fazer a limpeza."]],
    solucao: "Limpeza interna feita e pasta térmica trocada. Temperatura normalizada, sem novos reinícios." },
  { cat: "Hardware", pri: "Média", equip: null, titulo: "Solicitação de segundo monitor",
    descricao: "Preciso de um segundo monitor para trabalhar com as planilhas de conciliação.",
    conversa: [["T", "Solicitação aprovada pela coordenação. Vou verificar a disponibilidade no estoque."]],
    solucao: "Monitor de 24\" instalado e configurado como tela estendida." },
  { cat: "Software", pri: "Alta", equip: null, titulo: "Erro ao abrir o ERP",
    descricao: "Ao abrir o ERP aparece a mensagem \"Falha na conexão com o banco de dados\" e o sistema fecha.",
    conversa: [["T", "Outras pessoas do seu setor estão com o mesmo erro?"], ["S", "Sim, o setor inteiro está sem acesso."], ["T", "Acionei a equipe de sistemas, o serviço do banco do ERP caiu no servidor."]],
    solucao: "Serviço do banco do ERP reiniciado e monitoramento configurado para alertar se cair de novo. Acesso normalizado." },
  { cat: "Software", pri: "Média", equip: null, titulo: "Office pedindo ativação",
    descricao: "O Word e o Excel estão mostrando a mensagem \"Produto não licenciado\" e não deixam editar.",
    conversa: [["T", "Vou verificar a licença atribuída à sua conta."], ["S", "Ok, obrigado!"]],
    solucao: "A licença tinha sido removida por engano. Licença reatribuída, basta sair e entrar de novo no Office." },
  { cat: "Software", pri: "Baixa", equip: null, titulo: "Instalação do leitor de PDF",
    descricao: "Preciso de um leitor de PDF que permita assinar documentos digitalmente.",
    conversa: [],
    solucao: "Leitor de PDF instalado e certificado digital configurado para assinatura." },
  { cat: "Software", pri: "Urgente", equip: null, titulo: "Sistema de ponto fora do ar",
    descricao: "Ninguém consegue registrar o ponto desde as 8h. O sistema mostra erro 500.",
    conversa: [["T", "Estamos cientes, o servidor do sistema de ponto está fora. Já estou atuando."], ["S", "Os funcionários estão anotando o horário em papel enquanto isso."], ["T", "Ótimo, depois o RH pode lançar manualmente."]],
    solucao: "Disco do servidor estava cheio por causa dos logs. Espaço liberado, rotação de logs configurada e sistema no ar." },
  { cat: "Software", pri: "Média", equip: null, titulo: "Antivírus bloqueando planilha com macros",
    descricao: "O antivírus está bloqueando a planilha de comissões porque ela tem macros.",
    conversa: [["T", "Pode me enviar o caminho da planilha na rede?"], ["S", "\\\\servidor\\comercial\\comissoes_2026.xlsm"]],
    solucao: "Arquivo analisado, sem ameaças. Exceção adicionada no antivírus para a pasta do comercial." },
  { cat: "Software", pri: "Baixa", equip: null, titulo: "Assinatura de e-mail desconfigurada",
    descricao: "Minha assinatura de e-mail perdeu o logo e a formatação depois da atualização do Outlook.",
    conversa: [["T", "Vou aplicar de novo o modelo padrão da empresa."]],
    solucao: "Assinatura padrão reaplicada com o logo novo." },
  { cat: "Software", pri: "Alta", equip: null, titulo: "Relatório de vendas não gera no CRM",
    descricao: "O relatório mensal de vendas fica carregando para sempre e não gera. Preciso dele para a reunião de amanhã.",
    conversa: [["T", "Qual período você está filtrando?"], ["S", "O mês inteiro, todos os vendedores."], ["T", "O relatório está estourando o tempo limite. Vou gerar pelo servidor e te envio."]],
    solucao: "Relatório gerado e enviado por e-mail. Índice criado no banco do CRM: agora gera em poucos segundos." },
  { cat: "Rede", pri: "Alta", equip: null, titulo: "Sem acesso à internet",
    descricao: "Meu computador está conectado na rede, mas nenhum site abre.",
    conversa: [["T", "Consegue acessar as pastas da rede interna?"], ["S", "As pastas abrem, só a internet que não."], ["T", "Problema no proxy. Vou corrigir a configuração."]],
    solucao: "Configuração de proxy corrigida via política de grupo. Internet funcionando." },
  { cat: "Rede", pri: "Média", equip: null, titulo: "Wi-Fi caindo na sala de reuniões",
    descricao: "O Wi-Fi da sala de reuniões cai várias vezes durante as reuniões com clientes.",
    conversa: [["T", "Vou fazer uma medição de sinal na sala."], ["T", "O access point está sobrecarregado. Vamos instalar mais um."]],
    solucao: "Novo access point instalado na sala de reuniões. Sinal estável nos testes." },
  { cat: "Rede", pri: "Alta", equip: null, titulo: "VPN não conecta",
    descricao: "Estou trabalhando de casa e a VPN dá erro de autenticação.",
    conversa: [["T", "Você trocou sua senha recentemente?"], ["S", "Troquei ontem."], ["T", "A VPN guarda a senha antiga. Vou te passar o passo a passo para atualizar."]],
    solucao: "Credencial da VPN atualizada. Conexão estabelecida com sucesso." },
  { cat: "Rede", pri: "Média", equip: null, titulo: "Pasta de rede inacessível",
    descricao: "Não consigo abrir a pasta compartilhada do setor, aparece \"Acesso negado\".",
    conversa: [["T", "Vou verificar suas permissões no grupo do setor."]],
    solucao: "Usuário adicionado ao grupo correto do setor. Acesso liberado." },
  { cat: "Rede", pri: "Baixa", equip: null, titulo: "Ponto de rede sem sinal",
    descricao: "O ponto de rede da mesa nova não funciona.",
    conversa: [["T", "Vou verificar no rack se o ponto está ativo no switch."]],
    solucao: "Ponto estava desconectado no patch panel. Conectado e testado." },
  { cat: "Rede", pri: "Urgente", equip: null, titulo: "Internet fora em toda a empresa",
    descricao: "Ninguém da empresa consegue acessar a internet.",
    conversa: [["T", "O link principal caiu. Já abri chamado com a operadora."], ["S", "Tem previsão?"], ["T", "Ativei o link de contingência enquanto isso. A internet deve voltar em instantes, mais lenta."]],
    solucao: "A operadora normalizou o link principal (rompimento de fibra na rua). Tráfego voltou para o link principal." },
  { cat: "Acessos", pri: "Média", equip: null, titulo: "Acesso ao sistema para novo colaborador",
    descricao: "Um novo colaborador começa segunda-feira e precisa de e-mail, acesso ao ERP e à pasta do setor.",
    conversa: [["T", "Pode me confirmar o nome completo e o cargo do colaborador?"], ["S", "Enviei por e-mail os dados completos."]],
    solucao: "Conta criada, e-mail e acessos configurados. As credenciais foram entregues ao gestor." },
  { cat: "Acessos", pri: "Alta", equip: null, titulo: "Senha bloqueada",
    descricao: "Errei a senha várias vezes e minha conta foi bloqueada.",
    conversa: [],
    solucao: "Conta desbloqueada e senha temporária enviada. Troque no primeiro acesso." },
  { cat: "Acessos", pri: "Média", equip: null, titulo: "Desligamento de colaborador",
    descricao: "Colaborador desligado hoje. Favor remover todos os acessos e recolher o notebook.",
    conversa: [["T", "Acessos bloqueados. O notebook já foi recolhido?"], ["S", "Sim, está com o RH."]],
    solucao: "Acessos removidos, e-mail redirecionado para o gestor e notebook formatado e devolvido ao estoque." },
  { cat: "Acessos", pri: "Baixa", equip: null, titulo: "Liberação de acesso ao relatório financeiro",
    descricao: "Preciso de acesso de leitura ao módulo de relatórios financeiros.",
    conversa: [["T", "Preciso da aprovação do seu gestor. Pode pedir para ele responder aqui?"], ["S", "Ele aprovou por e-mail, vou encaminhar."]],
    solucao: "Aprovação recebida e acesso de leitura liberado." },
];

const PESO_PRIORIDADE = { Baixa: 1, Média: 1, Alta: 1, Urgente: 1 };

async function buscarOuCriar(model, where, data) {
  return (await prisma[model].findFirst({ where })) ?? prisma[model].create({ data });
}

async function gerarUsuariosEChamados() {
  if (await prisma.usuario.findUnique({ where: { email: MARCADOR_EMAIL } })) {
    console.log("Usuários e chamados da apresentação já existem neste banco. Pulando essa parte.");
    return;
  }

  const senhaHash = await bcrypt.hash("123456", 10);

  // ---- Referências (reaproveita o que já existe, pelo nome) ----
  const deps = {};
  for (const [nome, descricao] of DEPARTAMENTOS) {
    deps[nome] = await buscarOuCriar("departamento", { nome }, { nome, descricao });
  }
  const categorias = {};
  for (const [nome, descricao] of [
    ["Hardware", "Problemas com equipamentos físicos"],
    ["Software", "Problemas com sistemas e aplicativos"],
    ["Rede", "Conectividade e acesso à rede"],
    ["Acessos", "Contas, senhas e permissões"],
  ]) {
    categorias[nome] = await buscarOuCriar("categoria", { nome }, { nome, descricao });
  }
  const prioridades = Object.fromEntries((await prisma.prioridade.findMany()).map((p) => [p.nome, p]));
  for (const nome of Object.keys(PESO_PRIORIDADE)) {
    if (!prioridades[nome]) throw new Error(`Prioridade "${nome}" não encontrada. Rode o seed principal antes.`);
  }

  // ---- Usuários ----
  const criados = {};
  for (const [nome, slug, papel, cargo, dep, diasDesdeEntrada, ativo] of USUARIOS) {
    criados[slug] = await prisma.usuario.create({
      data: {
        nome,
        email: `${slug}@servicedesk.com`,
        senhaHash,
        papel,
        cargo,
        ativo,
        telefone: `(47) 9${String(8000 + Math.floor(aleatorio() * 1999))}-${String(1000 + Math.floor(aleatorio() * 8999))}`,
        departamentoId: deps[dep].id,
        createdAt: horarioComercial(diasDesdeEntrada),
      },
    });
  }

  // Contas de teste já existentes entram no histórico para quem logar com elas.
  const contaTeste = async (email) => prisma.usuario.findUnique({ where: { email } });
  const admin = await contaTeste("admin@servicedesk.com");
  const tecnicoTeste = await contaTeste("tecnico@servicedesk.com");
  const solicitanteTeste = await contaTeste("usuario@servicedesk.com");

  const tecnicos = [criados["rafael.lima"], criados["juliana.costa"], criados["bruno.almeida"], tecnicoTeste].filter(Boolean);
  const solicitantesAtivos = Object.values(criados).filter((u) => u.papel === "SOLICITANTE" && u.ativo);
  if (solicitanteTeste) solicitantesAtivos.push(solicitanteTeste, solicitanteTeste);
  const ex = criados["eduardo.barros"];

  // ---- Equipamentos (um por solicitante + impressoras dos setores) ----
  const equipamentosPorUsuario = new Map();
  let serie = 1;
  for (const u of [...solicitantesAtivos, ex]) {
    if (equipamentosPorUsuario.has(u.id)) continue;
    const ehNotebook = aleatorio() < 0.6;
    const equip = await prisma.equipamento.create({
      data: {
        nome: ehNotebook ? sortear(["Notebook Dell Latitude 5440", "Notebook Lenovo ThinkPad E14"]) : "Desktop Dell OptiPlex 7010",
        tipo: ehNotebook ? "Notebook" : "Desktop",
        numeroSerie: `APR-${ehNotebook ? "NB" : "DT"}-${String(serie++).padStart(3, "0")}`,
        usuarioId: u.id === ex.id ? null : u.id,
        departamentoId: u.departamentoId,
      },
    });
    equipamentosPorUsuario.set(u.id, [equip]);
  }
  const impressoras = {};
  for (const dep of ["Financeiro", "Comercial", "Logística", "RH"]) {
    impressoras[dep] = await prisma.equipamento.create({
      data: { nome: "Impressora HP LaserJet M428", tipo: "Impressora", numeroSerie: `APR-IMP-${dep.slice(0, 3).toUpperCase()}`, departamentoId: deps[dep].id },
    });
  }
  const nomeDepPorId = Object.fromEntries(Object.entries(deps).map(([n, d]) => [d.id, n]));

  // ---- Chamados ----
  let totalComentarios = 0;
  const chamadosCriados = [];
  const TOTAL = 78;

  for (let i = 0; i < TOTAL; i++) {
    const cenario = sortear(CENARIOS);
    // Mais chamados recentes do que antigos (volume crescente ao longo dos 90 dias).
    const diasAtras = Math.floor(Math.pow(aleatorio(), 1.4) * 90);
    let solicitante = sortear(solicitantesAtivos);
    // O ex-funcionário aparece em chamados antigos, de antes do desligamento.
    if (diasAtras > 40 && aleatorio() < 0.12) solicitante = ex;

    const criadoEm = horarioComercial(diasAtras);
    if (criadoEm.getTime() < solicitante.createdAt.getTime()) solicitante = sortear(solicitantesAtivos.filter((u) => u.createdAt < criadoEm)) ?? solicitante;

    const prioridade = prioridades[aleatorio() < 0.75 ? cenario.pri : sortear(Object.keys(PESO_PRIORIDADE))];

    // Antigos quase sempre fechados; recentes mais abertos/em andamento.
    const s = aleatorio();
    let status;
    if (diasAtras > 7) status = s < 0.88 ? "FECHADO" : s < 0.97 ? "EM_ANDAMENTO" : "ABERTO";
    else if (diasAtras > 2) status = s < 0.55 ? "FECHADO" : s < 0.85 ? "EM_ANDAMENTO" : "ABERTO";
    else status = s < 0.2 ? "FECHADO" : s < 0.55 ? "EM_ANDAMENTO" : "ABERTO";

    let fechadoEm = null;
    if (status === "FECHADO") {
      // Resolução entre 20% e 150% do SLA: a maioria cumpre, alguns estouram.
      fechadoEm = new Date(criadoEm.getTime() + prioridade.slaHoras * HORA * entre(0.2, 1.5));
      if (fechadoEm.getTime() > AGORA - HORA) {
        status = "EM_ANDAMENTO";
        fechadoEm = null;
      }
    }

    const tecnico = status === "ABERTO" ? null : sortear(tecnicos);

    let equipamentoId = null;
    if (cenario.equip === "Impressora") equipamentoId = impressoras[nomeDepPorId[solicitante.departamentoId]]?.id ?? null;
    else if (cenario.equip) equipamentoId = equipamentosPorUsuario.get(solicitante.id)?.[0]?.id ?? null;

    // Linha do tempo de comentários entre a abertura e o fechamento (ou agora).
    const fim = fechadoEm ? fechadoEm.getTime() : Math.min(AGORA - 10 * 60 * 1000, criadoEm.getTime() + prioridade.slaHoras * HORA * 2);
    const passos = [];
    if (tecnico) {
      passos.push([tecnico, `Olá, ${solicitante.nome.split(" ")[0]}! Chamado assumido, já estou verificando.`]);
      const conversa = status === "FECHADO" ? cenario.conversa : cenario.conversa.slice(0, Math.max(0, cenario.conversa.length - 1));
      for (const [quem, msg] of conversa) passos.push([quem === "T" ? tecnico : solicitante, msg]);
      if (status === "FECHADO") {
        passos.push([tecnico, cenario.solucao]);
        if (aleatorio() < 0.45) passos.push([solicitante, sortear(["Funcionou, muito obrigado!", "Perfeito, obrigada pela agilidade!", "Tudo certo agora. Valeu!", "Resolvido, obrigado pelo suporte."])]);
      }
    } else if (aleatorio() < 0.4) {
      passos.push([solicitante, "Alguém pode verificar? Ainda estou sem conseguir trabalhar direito."]);
    }

    const duracao = Math.max(fim - criadoEm.getTime(), 30 * 60 * 1000);
    const comentarios = passos.map(([autor, mensagem], idx) => ({
      usuarioId: autor.id,
      mensagem,
      createdAt: new Date(criadoEm.getTime() + (duracao * (idx + 1)) / (passos.length + 1)),
    }));
    const ultimoEvento = comentarios.at(-1)?.createdAt ?? criadoEm;

    const ticket = await prisma.ticket.create({
      data: {
        titulo: cenario.titulo,
        descricao: cenario.descricao,
        status,
        solicitanteId: solicitante.id,
        tecnicoId: tecnico?.id ?? null,
        categoriaId: categorias[cenario.cat].id,
        prioridadeId: prioridade.id,
        equipamentoId,
        createdAt: criadoEm,
        updatedAt: fechadoEm ?? ultimoEvento,
        closedAt: fechadoEm,
        comentarios: { create: comentarios },
      },
    });
    totalComentarios += comentarios.length;
    chamadosCriados.push({ ticket, solicitante, tecnico, comentarios, criadoEm });
  }

  // ---- Notificações dos últimos 10 dias (mesmo formato que o app gera) ----
  const STATUS_LABEL = { ABERTO: "Aberto", EM_ANDAMENTO: "Em andamento", FECHADO: "Fechado" };
  const equipe = [admin, criados["patricia.mendes"], ...tecnicos].filter(Boolean);
  const notificacoes = [];
  const lida = (data) => (data.getTime() < AGORA - 2 * DIA ? { lida: true, lidaEm: new Date(data.getTime() + 2 * HORA) } : {});

  for (const { ticket, solicitante, tecnico, comentarios, criadoEm } of chamadosCriados) {
    if (criadoEm.getTime() < AGORA - 10 * DIA) continue;
    for (const u of equipe) {
      notificacoes.push({ usuarioId: u.id, tipo: "TICKET_CRIADO", titulo: `Novo chamado #${ticket.id}`, mensagem: `${solicitante.nome} abriu o chamado "${ticket.titulo}".`, ticketId: ticket.id, createdAt: criadoEm, ...lida(criadoEm) });
    }
    if (tecnico) {
      const quando = new Date(comentarios[0].createdAt.getTime() - 5 * 60 * 1000);
      notificacoes.push({ usuarioId: tecnico.id, tipo: "TICKET_ATRIBUIDO", titulo: `Chamado #${ticket.id} atribuído a você`, mensagem: `Você ficou responsável por "${ticket.titulo}".`, ticketId: ticket.id, createdAt: quando, ...lida(quando) });
      notificacoes.push({ usuarioId: solicitante.id, tipo: "TICKET_ATRIBUIDO", titulo: `Seu chamado #${ticket.id} foi atribuído`, mensagem: `${tecnico.nome} vai cuidar de "${ticket.titulo}".`, ticketId: ticket.id, createdAt: quando, ...lida(quando) });
    }
    for (const c of comentarios) {
      const destinatario = c.usuarioId === solicitante.id ? tecnico : solicitante;
      if (!destinatario) continue;
      const autor = c.usuarioId === solicitante.id ? solicitante : tecnico;
      notificacoes.push({ usuarioId: destinatario.id, tipo: "TICKET_COMENTARIO", titulo: `Novo comentário no chamado #${ticket.id}`, mensagem: `${autor.nome} comentou em "${ticket.titulo}".`, ticketId: ticket.id, createdAt: c.createdAt, ...lida(c.createdAt) });
    }
    if (ticket.status !== "ABERTO") {
      const quando = ticket.closedAt ?? comentarios[0]?.createdAt ?? criadoEm;
      notificacoes.push({ usuarioId: solicitante.id, tipo: "TICKET_STATUS", titulo: `Chamado #${ticket.id}: ${STATUS_LABEL[ticket.status]}`, mensagem: `O status de "${ticket.titulo}" mudou para ${STATUS_LABEL[ticket.status]}.`, ticketId: ticket.id, createdAt: quando, ...lida(quando) });
    }
  }
  await prisma.notificacao.createMany({ data: notificacoes });

  // ---- Resumo ----
  const porStatus = chamadosCriados.reduce((acc, { ticket }) => ({ ...acc, [ticket.status]: (acc[ticket.status] ?? 0) + 1 }), {});
  console.log("Histórico da apresentação criado:");
  console.log(`  ${USUARIOS.length} usuários (senha 123456), ${equipamentosPorUsuario.size + 4} equipamentos`);
  console.log(`  ${chamadosCriados.length} chamados nos últimos 90 dias:`, porStatus);
  console.log(`  ${totalComentarios} comentários, ${notificacoes.length} notificações`);
  console.log("  Logins sugeridos: patricia.mendes@servicedesk.com (admin), rafael.lima@servicedesk.com (técnico), ana.souza@servicedesk.com (solicitante)");
}

// CNPJ fictício, mas com dígitos verificadores válidos (a API valida).
function cnpjComDigitos(base12) {
  const digito = (base, pesos) => {
    const resto = [...base].reduce((t, d, i) => t + Number(d) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base12}${d1}${d2}`;
}

// Empresas fictícias. [nome, base do CNPJ, contato, telefone, email, ativo]
const FORNECEDORES = [
  ["TecnoServ Manutenção de Equipamentos Ltda", "482917350001", "Marcos Vieira", "(47) 3322-4510", "suporte@tecnoserv.com.br", true],
  ["PrintMax Soluções em Impressão Ltda", "315608920001", "Simone Arruda", "(47) 3045-7788", "contratos@printmax.com.br", true],
  ["InfoParts Comércio de Informática Ltda", "276540180001", "Diego Fontana", "(47) 3211-9034", "vendas@infoparts.com.br", true],
  ["RedeSul Telecom e Infraestrutura S.A.", "593281470001", "Aline Prado", "(47) 3090-1200", "empresas@redesul.net.br", true],
  ["DataCare Assistência Técnica ME", "184736290001", "Jonas Kruger", "(47) 99812-4477", "datacare.atendimento@gmail.com", false],
];

async function gerarFornecedoresEContratos() {
  const cnpjMarcador = cnpjComDigitos(FORNECEDORES[0][1]);
  if (await prisma.fornecedor.findUnique({ where: { cnpj: cnpjMarcador } })) {
    console.log("Fornecedores e contratos da apresentação já existem neste banco. Pulando essa parte.");
    return;
  }

  const forn = {};
  for (const [nome, base, contato, telefone, email, ativo] of FORNECEDORES) {
    forn[nome.split(" ")[0]] = await prisma.fornecedor.create({
      data: { nome, cnpj: cnpjComDigitos(base), contato, telefone, email, ativo, createdAt: horarioComercial(Math.floor(entre(150, 400))) },
    });
  }

  const equipamentos = await prisma.equipamento.findMany({ where: { numeroSerie: { startsWith: "APR-" } }, orderBy: { numeroSerie: "asc" } });
  const impressoras = equipamentos.filter((e) => e.tipo === "Impressora");
  // O computador sem dono (era do ex-funcionário) vem primeiro: vira o contrato suspenso.
  const computadores = equipamentos
    .filter((e) => e.tipo !== "Impressora")
    .sort((a, b) => (a.usuarioId === null ? -1 : 0) - (b.usuarioId === null ? -1 : 0));
  if (!equipamentos.length) {
    console.log("Nenhum equipamento da apresentação encontrado; contratos não foram criados.");
    return;
  }

  // Datas relativas a hoje: alguns contratos vencem em breve, outros já acabaram.
  const dia = (deslocamento) => {
    const d = new Date(AGORA + deslocamento * DIA);
    d.setUTCHours(12, 0, 0, 0);
    return d;
  };
  const contratos = [];
  impressoras.forEach((imp, i) => {
    const vencendo = i === 0;
    contratos.push({
      titulo: `Outsourcing de impressão - ${imp.numeroSerie.replace("APR-IMP-", "Setor ")}`,
      fornecedorId: forn.PrintMax.id, equipamentoId: imp.id,
      inicio: dia(vencendo ? -345 : -200), fim: dia(vencendo ? 20 : 165),
      valor: 389.9 * 12, status: "ATIVO",
      observacoes: vencendo
        ? "Vence em breve: avaliar renovação com reajuste de 4,5% proposto pelo fornecedor."
        : "Inclui toner, peças e visita técnica em até 8h úteis. Franquia de 3.000 páginas/mês.",
    });
  });
  // Contrato antigo de impressão, encerrado ao trocar de fornecedor.
  if (impressoras[0]) {
    contratos.push({
      titulo: "Manutenção de impressoras (contrato anterior)", fornecedorId: forn.DataCare.id, equipamentoId: impressoras[0].id,
      inicio: dia(-710), fim: dia(-346), valor: 2900, status: "ENCERRADO",
      observacoes: "Não renovado: atendimento lento e sem reposição de peças. Substituído pelo contrato com a PrintMax.",
    });
  }
  computadores.slice(0, 8).forEach((pc, i) => {
    const suspenso = pc.usuarioId === null;
    contratos.push({
      titulo: `Garantia estendida e manutenção - ${pc.nome} (${pc.numeroSerie})`,
      fornecedorId: (i % 3 === 2 ? forn.InfoParts : forn.TecnoServ).id, equipamentoId: pc.id,
      inicio: dia(-Math.floor(entre(60, 300))), fim: dia(Math.floor(entre(90, 700))),
      valor: Math.round(entre(450, 1300)) + 0.9, status: suspenso ? "SUSPENSO" : "ATIVO",
      observacoes: suspenso
        ? "Suspenso: equipamento recolhido após o desligamento do colaborador, aguardando realocação."
        : "Cobertura on-site, troca de peças inclusa. SLA de 2 dias úteis.",
    });
  });
  for (const [i, pc] of computadores.slice(8, 11).entries()) {
    contratos.push({
      titulo: `Garantia de fábrica - ${pc.numeroSerie}`, fornecedorId: forn.InfoParts.id, equipamentoId: pc.id,
      inicio: dia(-400 - i * 30), fim: dia(-35 - i * 20), valor: 299.9, status: "ENCERRADO",
      observacoes: "Garantia de 12 meses encerrada. Avaliar contratação de garantia estendida.",
    });
  }

  await prisma.contratoManutencao.createMany({ data: contratos });

  const porStatus = contratos.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {});
  const valorAtivo = contratos.filter((c) => c.status === "ATIVO").reduce((t, c) => t + c.valor, 0);
  console.log(`  ${FORNECEDORES.length} fornecedores, ${contratos.length} contratos:`, porStatus);
  console.log(`  Valor anual em contratos ativos: R$ ${valorAtivo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

async function main() {
  await gerarUsuariosEChamados();
  await gerarFornecedoresEContratos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
