import prisma from "../config/prisma.js";
import { enviarEmail } from "./mailer.js";
import { buscarEquipe, buscarGestoresDoSetor, buscarUsuario, notificarUsuarios } from "./notificar.js";

const STATUS_LABEL = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_USUARIO: "Aguardando resposta do usuário",
  SUSPENSO: "Suspenso",
  FECHADO: "Fechado",
};

const DEPS_PADRAO = { prisma, enviarEmail };

// Quem deve ser avisado de um comentário: a outra ponta da conversa.
// - solicitante comentou  -> técnico responsável (ou a equipe, se ainda não há um)
// - equipe comentou       -> solicitante (e o técnico responsável, se for outra pessoa)
export function destinatariosDoComentario(ticket, autor) {
  const ids = new Set();
  let incluirEquipe = false;

  if (autor.papel === "SOLICITANTE") {
    if (ticket.tecnicoId) ids.add(ticket.tecnicoId);
    else incluirEquipe = true;
  } else {
    ids.add(ticket.solicitanteId);
    if (ticket.tecnicoId) ids.add(ticket.tecnicoId);
  }
  ids.delete(autor.id);
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

async function executar(nome, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[eventosTicket] falha em ${nome}:`, err);
  }
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

export function avisarStatusAlterado(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarStatusAlterado", async () => {
    const solicitante = await buscarUsuario(ticket.solicitanteId, deps);
    await notificarUsuarios(
      {
        destinatarios: [solicitante],
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id}: ${STATUS_LABEL[ticket.status] ?? ticket.status}`,
        mensagem: `O status de "${ticket.titulo}" mudou para ${STATUS_LABEL[ticket.status] ?? ticket.status}.`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

// Avisa quem está cuidando do chamado que o solicitante respondeu e o
// atendimento voltou a andar. Sem técnico responsável, avisa a equipe.
export function avisarRetomadaDeAtendimento(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarRetomadaDeAtendimento", async () => {
    const tecnico = await buscarUsuario(ticket.tecnicoId, deps);
    const destinatarios = tecnico ? [tecnico] : await buscarEquipe(deps);
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

// Avisa o solicitante que o atendimento foi suspenso, já com o motivo.
export function avisarTicketSuspenso(ticket, autor, motivo, deps = DEPS_PADRAO) {
  return executar("avisarTicketSuspenso", async () => {
    const solicitante = await buscarUsuario(ticket.solicitanteId, deps);
    await notificarUsuarios(
      {
        destinatarios: [solicitante],
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id}: ${STATUS_LABEL.SUSPENSO}`,
        mensagem: `${autor.nome} suspendeu "${ticket.titulo}". Motivo: ${motivo}`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
}

// Avisa o solicitante que o chamado saiu da suspensão e voltou a andar.
export function avisarTicketRetomado(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarTicketRetomado", async () => {
    const solicitante = await buscarUsuario(ticket.solicitanteId, deps);
    await notificarUsuarios(
      {
        destinatarios: [solicitante],
        tipo: "TICKET_STATUS",
        titulo: `Chamado #${ticket.id} voltou para ${STATUS_LABEL.EM_ANDAMENTO}`,
        mensagem: `${autor.nome} retomou o atendimento de "${ticket.titulo}".`,
        ticketId: ticket.id,
        autorId: autor.id,
      },
      deps
    );
  });
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

// Avisa o solicitante da decisão do gestor (e o motivo, quando rejeitado).
export function avisarAprovacaoDecidida(ticket, gestor, aprovado, motivo, deps = DEPS_PADRAO) {
  return executar("avisarAprovacaoDecidida", async () => {
    const solicitante = await buscarUsuario(ticket.solicitanteId, deps);
    await notificarUsuarios(
      {
        destinatarios: [solicitante],
        tipo: "TICKET_APROVACAO",
        titulo: aprovado ? `Chamado #${ticket.id} aprovado` : `Chamado #${ticket.id} rejeitado`,
        mensagem: aprovado
          ? `${gestor.nome} aprovou "${ticket.titulo}". Ele segue para atendimento.`
          : `${gestor.nome} rejeitou "${ticket.titulo}". Motivo: ${motivo}`,
        ticketId: ticket.id,
        autorId: gestor.id,
      },
      deps
    );
  });
}

export function avisarComentario(ticket, autor, deps = DEPS_PADRAO) {
  return executar("avisarComentario", async () => {
    const { ids, incluirEquipe } = destinatariosDoComentario(ticket, autor);
    const [pessoas, equipe] = await Promise.all([
      Promise.all(ids.map((id) => buscarUsuario(id, deps))),
      incluirEquipe ? buscarEquipe(deps) : [],
    ]);
    await notificarUsuarios(
      {
        destinatarios: [...pessoas, ...equipe],
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
