import prisma from "../config/prisma.js";
import { enviarEmail } from "./mailer.js";
import {
  buscarColaboradores,
  buscarEquipe,
  buscarGestoresDoSetor,
  buscarUsuario,
  filtrarDestinatarios,
  notificarUsuarios,
} from "./notificar.js";

const STATUS_LABEL = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_USUARIO: "Aguardando resposta do usuário",
  SUSPENSO: "Suspenso",
  FECHADO: "Fechado",
};

const DEPS_PADRAO = { prisma, enviarEmail };

// Envolvidos no chamado: solicitante, atendente responsável e colaboradores,
// sem o autor da ação, sem repetidos e sem inativos. `pessoas` traz os
// usuários já carregados: { solicitante, tecnico, colaboradores: [] }.
export function envolvidosDoChamado(pessoas, autor) {
  const { solicitante = null, tecnico = null, colaboradores = [] } = pessoas ?? {};
  return filtrarDestinatarios([solicitante, tecnico, ...colaboradores], autor?.id);
}

// Quem deve ser avisado de um comentário: a outra ponta da conversa.
// - solicitante comentou  -> responsável e colaboradores (ou a equipe, se não há ninguém)
// - equipe comentou       -> solicitante, responsável e colaboradores
// `ticket.colaboradores` é uma lista de { id } (pode faltar em chamado antigo).
export function destinatariosDoComentario(ticket, autor) {
  const ids = new Set();
  const colaboradores = (ticket.colaboradores ?? []).map((c) => c.id);

  if (autor.papel !== "SOLICITANTE") ids.add(ticket.solicitanteId);
  if (ticket.tecnicoId) ids.add(ticket.tecnicoId);
  for (const id of colaboradores) ids.add(id);
  ids.delete(autor.id);

  const incluirEquipe = autor.papel === "SOLICITANTE" && ids.size === 0;
  return { ids: [...ids], incluirEquipe };
}

// "Aguardando resposta do usuário" existe justamente esperando o solicitante:
// quando ele comenta, o chamado volta a andar sozinho, sem ninguém mexer no
// status na mão. Quem responde tem que ser o solicitante do chamado — comentário
// de técnico ou admin não tira o chamado da espera.
export function deveRetomarAtendimento(ticket, autor) {
  return ticket.status === "AGUARDANDO_USUARIO" && ticket.solicitanteId === autor.id;
}

// Regras de suspensão. Devolvem a mensagem de erro para a API, ou null quando a
// ação pode seguir. Chamado fechado não é suspenso (já não conta SLA) e
// suspender duas vezes criaria um segundo comentário de motivo à toa.
export function erroAoSuspender(ticket) {
  if (ticket.status === "SUSPENSO") return "O chamado já está suspenso";
  if (ticket.status === "FECHADO") return "Chamado fechado não pode ser suspenso";
  return null;
}

export function erroAoRetomar(ticket) {
  return ticket.status === "SUSPENSO" ? null : "Só é possível retomar um chamado suspenso";
}

// O motivo vira um comentário comum no chamado, assim aparece no histórico da
// conversa para o solicitante e para a equipe.
export function comentarioDeSuspensao(motivo) {
  return `Chamado suspenso. Motivo: ${motivo}`;
}

// Regras do encaminhamento para outro atendente. `destino` é o usuário que vai
// receber o chamado (ou null, quando o id não existe). Devolvem a mensagem de
// erro para a API, ou null quando a ação pode seguir.
export function erroAoEncaminhar(ticket, destino) {
  if (ticket.status === "FECHADO") return "Chamado fechado não pode ser encaminhado";
  if (!destino || !destino.ativo || destino.papel === "SOLICITANTE") {
    return "O destino precisa ser um atendente ativo";
  }
  if (ticket.tecnicoId === destino.id) return "O chamado já está com este atendente";
  return null;
}

// Encaminhar um chamado ainda aberto já coloca alguém para cuidar dele, então
// ele passa a andar; nos demais status o encaminhamento não mexe no status.
export function statusAoEncaminhar(ticket) {
  return ticket.status === "ABERTO" ? "EM_ANDAMENTO" : ticket.status;
}

// Como na suspensão, o motivo fica registrado como comentário no histórico.
export function comentarioDeEncaminhamento(anterior, novo, motivo) {
  return `Chamado encaminhado de ${anterior?.nome ?? "sem atendente"} para ${novo.nome}. Motivo: ${motivo}`;
}

async function executar(nome, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[eventosTicket] falha em ${nome}:`, err);
  }
}

// Carrega solicitante, responsável e colaboradores do chamado como destinatários.
// Os ids vêm do chamado que o controller acabou de gravar; os colaboradores,
// do banco (os tickets devolvidos pelas rotas de alteração não os trazem).
async function carregarEnvolvidos(ticket, deps) {
  const [solicitante, tecnico, colaboradores] = await Promise.all([
    buscarUsuario(ticket.solicitanteId, deps),
    buscarUsuario(ticket.tecnicoId, deps),
    buscarColaboradores(ticket.id, deps),
  ]);
  return { solicitante, tecnico, colaboradores };
}

// Mesmo aviso para todos os envolvidos (menos o autor).
async function avisarEnvolvidos(ticket, autor, { tipo, titulo, mensagem }, deps) {
  const destinatarios = envolvidosDoChamado(await carregarEnvolvidos(ticket, deps), autor);
  await notificarUsuarios({ destinatarios, tipo, titulo, mensagem, ticketId: ticket.id, autorId: autor.id }, deps);
}

// Textos dos avisos de encaminhamento, um para cada grupo de pessoas.
export function mensagensDeEncaminhamento(ticket, autor, novo, motivo) {
  const nomeNovo = novo?.nome ?? "outro atendente";
  return {
    novo: {
      titulo: `Chamado #${ticket.id} encaminhado para você`,
      mensagem: `${autor.nome} encaminhou "${ticket.titulo}" para você. Motivo: ${motivo}`,
    },
    anterior: {
      titulo: `Chamado #${ticket.id} mudou de atendente`,
      mensagem: `${autor.nome} encaminhou "${ticket.titulo}" para ${nomeNovo}. Motivo: ${motivo}`,
    },
    demais: {
      titulo: `Chamado #${ticket.id} mudou de atendente`,
      mensagem: `"${ticket.titulo}" agora está com ${nomeNovo}.`,
    },
  };
}

// Encaminhamento: o novo atendente recebe o chamado com o motivo; o anterior
// fica sabendo para quem foi (também com o motivo); solicitante e colaboradores
// só ficam sabendo quem cuida agora. `ticket` já é o chamado depois da troca.
export function avisarTicketEncaminhado(ticket, autor, { anteriorId = null, motivo }, deps = DEPS_PADRAO) {
  return executar("avisarTicketEncaminhado", async () => {
    const [novo, anterior, pessoas] = await Promise.all([
      buscarUsuario(ticket.tecnicoId, deps),
      buscarUsuario(anteriorId, deps),
      carregarEnvolvidos({ ...ticket, tecnicoId: null }, deps),
    ]);
    const textos = mensagensDeEncaminhamento(ticket, autor, novo, motivo);
    const jaAvisados = new Set([novo?.id, anterior?.id]);
    const demais = envolvidosDoChamado(pessoas, autor).filter((u) => !jaAvisados.has(u.id));

    const grupos = [
      [novo ? [novo] : [], textos.novo],
      [anterior ? [anterior] : [], textos.anterior],
      [demais, textos.demais],
    ];
    for (const [destinatarios, { titulo, mensagem }] of grupos) {
      if (destinatarios.length === 0) continue;
      await notificarUsuarios(
        { destinatarios, tipo: "TICKET_ENCAMINHADO", titulo, mensagem, ticketId: ticket.id, autorId: autor.id },
        deps
      );
    }
  });
}

// Avisa quem acabou de entrar como colaborador.
export function avisarColaboradorAdicionado(ticket, autor, usuarioId, deps = DEPS_PADRAO) {
  return executar("avisarColaboradorAdicionado", async () => {
    const colaborador = await buscarUsuario(usuarioId, deps);
    if (!colaborador) return;
    await notificarUsuarios(
      {
        destinatarios: [colaborador],
        tipo: "TICKET_COLABORADOR",
        titulo: `Você foi adicionado ao chamado #${ticket.id}`,
        mensagem: `${autor.nome} adicionou você como colaborador em "${ticket.titulo}".`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

export function avisarTicketCriado(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarTicketCriado", async () => {
    const equipe = await buscarEquipe(deps);
    await notificarUsuarios(
      {
        destinatarios: equipe,
        tipo: "TICKET_CRIADO",
        titulo: `Novo chamado #${ticket.id}`,
        mensagem: `${autor.nome} abriu o chamado "${ticket.titulo}".`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

export function avisarTicketAtribuido(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarTicketAtribuido", async () => {
    const [tecnico, solicitante] = await Promise.all([
      buscarUsuario(ticket.tecnicoId, deps),
      buscarUsuario(ticket.solicitanteId, deps),
    ]);

    if (tecnico) {
      await notificarUsuarios(
        {
          destinatarios: [tecnico],
          tipo: "TICKET_ATRIBUIDO",
          titulo: `Chamado #${ticket.id} atribuído a você`,
          mensagem: `Você ficou responsável por "${ticket.titulo}".`,
          ticketId: ticket.id,
          autorId: autor.id,
        },
        deps
      );
    }
    if (solicitante) {
      await notificarUsuarios(
        {
          destinatarios: [solicitante],
          tipo: "TICKET_ATRIBUIDO",
          titulo: `Seu chamado #${ticket.id} foi atribuído`,
          mensagem: `${tecnico?.nome ?? "Um técnico"} vai cuidar de "${ticket.titulo}".`,
          ticketId: ticket.id,
          autorId: autor.id,
        },
        deps
      );
    }
  });
}

// Mudança de status: todos os envolvidos (menos quem mudou).
export function avisarStatusAlterado(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarStatusAlterado", () =>
    avisarEnvolvidos(
      ticket,
      autor,
      {
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id}: ${STATUS_LABEL[ticket.status] ?? ticket.status}`,
        mensagem: `O status de "${ticket.titulo}" mudou para ${STATUS_LABEL[ticket.status] ?? ticket.status}.`,
      },
      deps
    )
  );
}

// Avisa quem cuida do chamado (responsável e colaboradores) que o solicitante
// respondeu e o atendimento voltou a andar. Sem ninguém, avisa a equipe.
export function avisarRetomadaDeAtendimento(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarRetomadaDeAtendimento", async () => {
    const envolvidos = envolvidosDoChamado(await carregarEnvolvidos(ticket, deps), autor);
    const destinatarios = envolvidos.length > 0 ? envolvidos : await buscarEquipe(deps);
    await notificarUsuarios(
      {
        destinatarios,
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id} voltou para ${STATUS_LABEL.EM_ANDAMENTO}`,
        mensagem: `${autor.nome} respondeu em "${ticket.titulo}" e o chamado saiu da espera.`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

// Avisa os envolvidos que o atendimento foi suspenso, já com o motivo.
export function avisarTicketSuspenso(ticket, autor, motivo, deps = DEPS_PADRAO) {
  return executar("avisarTicketSuspenso", () =>
    avisarEnvolvidos(
      ticket,
      autor,
      {
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id}: ${STATUS_LABEL.SUSPENSO}`,
        mensagem: `${autor.nome} suspendeu "${ticket.titulo}". Motivo: ${motivo}`,
      },
      deps
    )
  );
}

// Avisa os envolvidos que o chamado saiu da suspensão e voltou a andar.
export function avisarTicketRetomado(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarTicketRetomado", () =>
    avisarEnvolvidos(
      ticket,
      autor,
      {
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id} voltou para ${STATUS_LABEL.EM_ANDAMENTO}`,
        mensagem: `${autor.nome} retomou o atendimento de "${ticket.titulo}".`,
      },
      deps
    )
  );
}

// Chamado de categoria com aprovação: avisa os gestores do setor (o time de
// atendimento só é avisado depois que o gestor aprova).
export function avisarAprovacaoPendente(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarAprovacaoPendente", async () => {
    const gestores = await buscarGestoresDoSetor(ticket.departamentoId, deps);
    await notificarUsuarios(
      {
        destinatarios: gestores,
        tipo: "TICKET_APROVACAO",
        titulo: `Chamado #${ticket.id} aguarda sua aprovação`,
        mensagem: `${autor.nome} abriu "${ticket.titulo}" e a categoria exige aprovação do gestor.`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

// Avisa os envolvidos da decisão do gestor (e o motivo, quando rejeitado).
export function avisarAprovacaoDecidida(ticket, gestor, aprovado, motivo, deps = DEPS_PADRAO) {
  return executar("avisarAprovacaoDecidida", () =>
    avisarEnvolvidos(
      ticket,
      gestor,
      {
        tipo: "TICKET_APROVACAO",
        titulo: aprovado ? `Chamado #${ticket.id} aprovado` : `Chamado #${ticket.id} rejeitado`,
        mensagem: aprovado
          ? `${gestor.nome} aprovou "${ticket.titulo}". Ele segue para atendimento.`
          : `${gestor.nome} rejeitou "${ticket.titulo}". Motivo: ${motivo}`,
      },
      deps
    )
  );
}

export function avisarComentario(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarComentario", async () => {
    const pessoas = await carregarEnvolvidos(ticket, deps);
    const { ids, incluirEquipe } = destinatariosDoComentario({ ...ticket, colaboradores: pessoas.colaboradores }, autor);
    const porId = new Map(
      [pessoas.solicitante, pessoas.tecnico, ...pessoas.colaboradores].filter(Boolean).map((u) => [u.id, u])
    );
    const alvos = filtrarDestinatarios(ids.map((id) => porId.get(id)), autor.id);
    // Solicitante comentou e ninguém ativo cuida do chamado: a equipe fica sabendo.
    const equipe = incluirEquipe || (autor.papel === "SOLICITANTE" && alvos.length === 0) ? await buscarEquipe(deps) : [];
    await notificarUsuarios(
      {
        destinatarios: [...alvos, ...equipe],
        tipo: "TICKET_COMENTARIO",
        titulo: `Novo comentário no chamado #${ticket.id}`,
        mensagem: `${autor.nome} comentou em "${ticket.titulo}".`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}
