import prisma from "../config/prisma.js";
import { enviarEmail } from "./mailer.js";
import { buscarEquipe, buscarUsuario, notificarUsuarios } from "./notificar.js";

const STATUS_LABEL = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_USUARIO: "Aguardando resposta do usuário",
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
