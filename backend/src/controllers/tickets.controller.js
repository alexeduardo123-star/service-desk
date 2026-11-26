import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { montarFiltroTickets, montarOrdenacaoTickets, fechadosNoFim } from "../utils/filtrosTicket.js";
import {
  avisarTicketCriado,
  avisarTicketAtribuido,
  avisarStatusAlterado,
  avisarTicketSuspenso,
  avisarTicketRetomado,
  comentarioDeSuspensao,
  erroAoRetomar,
  erroAoSuspender,
} from "../utils/eventosTicket.js";

const include = {
  solicitante: { select: { id: true, nome: true } },
  tecnico: { select: { id: true, nome: true } },
  categoria: true,
  prioridade: true,
  equipamento: true,
  departamento: true,
  assunto: { select: { id: true, nome: true } },
};

function podeVer(ticket, user) {
  return user.papel !== "SOLICITANTE" || ticket.solicitanteId === user.id;
}

export const listar = asyncHandler(async (req, res) => {
  const where = montarFiltroTickets(req.query, req.user);
  const { orderBy } = montarOrdenacaoTickets(req.query);
  const tickets = await prisma.ticket.findMany({ where, include, orderBy });
  res.json(fechadosNoFim(tickets));
});

export const buscar = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: { ...include, comentarios: { include: { usuario: { select: { id: true, nome: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  if (!podeVer(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });
  res.json(ticket);
});

export const criar = asyncHandler(async (req, res) => {
  const { titulo, descricao, categoriaId, equipamentoId, departamentoId, assuntoId } = req.body;
  let { prioridadeId } = req.body;

  // Com assunto escolhido, a prioridade é a cadastrada nele (o que veio do
  // cliente é ignorado). Sem assunto, vale a prioridade informada.
  if (assuntoId) {
    const assunto = await prisma.assunto.findUnique({
      where: { id: assuntoId },
      select: { id: true, ativo: true, prioridadeId: true },
    });
    if (!assunto || !assunto.ativo) return res.status(400).json({ erro: "Assunto inválido ou inativo" });
    prioridadeId = assunto.prioridadeId ?? prioridadeId;
  }
  if (!prioridadeId) return res.status(400).json({ erro: "Informe a prioridade do chamado" });

  const ticket = await prisma.ticket.create({
    data: {
      titulo,
      descricao,
      categoriaId,
      prioridadeId,
      assuntoId: assuntoId || null,
      equipamentoId: equipamentoId || null,
      departamentoId: departamentoId || null,
      solicitanteId: req.user.id,
    },
    include,
  });
  avisarTicketCriado(ticket, req.user);
  res.status(201).json(ticket);
});

export const atualizar = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  if (!podeVer(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });

  const { titulo, descricao, categoriaId, prioridadeId, equipamentoId } = req.body;
  const atualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { titulo, descricao, categoriaId, prioridadeId, equipamentoId },
    include,
  });
  res.json(atualizado);
});

export const alterarStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  // Ao fechar registra a data; ao reabrir (arrastar de volta no kanban, por
  // exemplo) limpa, senão o chamado ficaria "aberto" com data de fechamento.
  const data = { status, closedAt: status === "FECHADO" ? new Date() : null };

  const ticket = await prisma.ticket.update({
    where: { id: Number(req.params.id) },
    data,
    include,
  });
  avisarStatusAlterado(ticket, req.user);
  res.json(ticket);
});

// Suspende o atendimento. O motivo é obrigatório (validado em suspenderSchema)
// e fica registrado como comentário; status e comentário mudam juntos.
export const suspender = asyncHandler(async (req, res) => {
  const atual = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!atual) return res.status(404).json({ erro: "Não encontrado" });
  const erro = erroAoSuspender(atual);
  if (erro) return res.status(409).json({ erro });

  const { motivo } = req.body;
  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({ where: { id: atual.id }, data: { status: "SUSPENSO" }, include }),
    prisma.comentario.create({ data: { ticketId: atual.id, usuarioId: req.user.id, mensagem: comentarioDeSuspensao(motivo) } }),
  ]);
  avisarTicketSuspenso(ticket, req.user, motivo);
  res.json(ticket);
});

export const retomar = asyncHandler(async (req, res) => {
  const atual = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!atual) return res.status(404).json({ erro: "Não encontrado" });
  const erro = erroAoRetomar(atual);
  if (erro) return res.status(409).json({ erro });

  const ticket = await prisma.ticket.update({ where: { id: atual.id }, data: { status: "EM_ANDAMENTO" }, include });
  avisarTicketRetomado(ticket, req.user);
  res.json(ticket);
});

export const atribuir = asyncHandler(async (req, res) => {
  const { tecnicoId } = req.body;
  const ticket = await prisma.ticket.update({
    where: { id: Number(req.params.id) },
    data: { tecnicoId, status: "EM_ANDAMENTO" },
    include,
  });
  avisarTicketAtribuido(ticket, req.user);
  res.json(ticket);
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.ticket.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
