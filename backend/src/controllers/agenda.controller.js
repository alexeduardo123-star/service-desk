import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { obterOverrides } from "../utils/permissoesCache.js";
import { papelTemPermissao } from "../utils/permissoes.js";
import { podeSerAtendente } from "../utils/responsavelAssunto.js";
import { podeGerenciarAgendamento, prazosNoPeriodo } from "../utils/agenda.js";
import { consultaAgendaSchema } from "../schemas/agenda.schemas.js";

const incluir = {
  atendente: { select: { id: true, nome: true } },
  ticket: { select: { id: true, titulo: true } },
};

async function gerenciaTodos(user) {
  return papelTemPermissao(user.papel, "agenda.todos", await obterOverrides());
}

// Calendário do período: prazos de SLA dos chamados em aberto + atendimentos
// agendados que encostam no período.
export const listar = asyncHandler(async (req, res) => {
  const consulta = consultaAgendaSchema.safeParse(req.query);
  if (!consulta.success) {
    return res.status(400).json({ erro: consulta.error.issues[0]?.message || "Período inválido" });
  }
  const { inicio, fim, atendenteId } = consulta.data;

  const [agendamentos, tickets] = await Promise.all([
    prisma.agendamento.findMany({
      where: { inicio: { lt: fim }, fim: { gt: inicio }, ...(atendenteId && { atendenteId }) },
      include: incluir,
      orderBy: { inicio: "asc" },
    }),
    // Só chamados abertos e que já existiam até o fim do período; o prazo exato
    // é calculado em prazosNoPeriodo.
    prisma.ticket.findMany({
      where: {
        status: { notIn: ["FECHADO", "SUSPENSO"] },
        aprovacaoStatus: { not: "REJEITADA" },
        createdAt: { lt: fim },
        ...(atendenteId && { tecnicoId: atendenteId }),
      },
      select: {
        id: true,
        titulo: true,
        status: true,
        aprovacaoStatus: true,
        createdAt: true,
        prioridade: { select: { id: true, nome: true, slaHoras: true } },
        tecnico: { select: { id: true, nome: true } },
      },
    }),
  ]);

  res.json({ prazos: prazosNoPeriodo(tickets, inicio, fim), agendamentos });
});

// Confere atendente, chamado e conflito de horário. Devolve { status, erro } ou null.
async function problemaDoAgendamento({ atendenteId, ticketId, inicio, fim }, idAtual = null) {
  const atendente = await prisma.usuario.findUnique({ where: { id: atendenteId }, select: { papel: true, ativo: true } });
  if (!podeSerAtendente(atendente)) {
    return { status: 400, erro: "O atendente precisa existir, estar ativo e ser técnico ou administrador" };
  }

  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) return { status: 400, erro: "Chamado não encontrado" };
  }

  const conflito = await prisma.agendamento.findFirst({
    where: { atendenteId, inicio: { lt: fim }, fim: { gt: inicio }, ...(idAtual && { id: { not: idAtual } }) },
    select: { titulo: true },
  });
  if (conflito) {
    return { status: 409, erro: `O atendente já tem um atendimento nesse horário: ${conflito.titulo}` };
  }
  return null;
}

export const criar = asyncHandler(async (req, res) => {
  const atendenteId = req.body.atendenteId ?? req.user.id;
  const permitido = podeGerenciarAgendamento({
    usuarioId: req.user.id,
    atendenteId,
    temPermissaoTodos: await gerenciaTodos(req.user),
  });
  if (!permitido) return res.status(403).json({ erro: "Você só pode agendar na sua própria agenda" });

  const dados = { ...req.body, atendenteId };
  const problema = await problemaDoAgendamento(dados);
  if (problema) return res.status(problema.status).json({ erro: problema.erro });

  const criado = await prisma.agendamento.create({
    data: {
      titulo: dados.titulo,
      descricao: dados.descricao,
      inicio: dados.inicio,
      fim: dados.fim,
      atendenteId,
      ticketId: dados.ticketId,
      criadoPorId: req.user.id,
    },
    include: incluir,
  });
  res.status(201).json(criado);
});

export const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const atual = await prisma.agendamento.findUnique({ where: { id } });
  if (!atual) return res.status(404).json({ erro: "Agendamento não encontrado" });

  const todos = await gerenciaTodos(req.user);
  const atendenteId = req.body.atendenteId ?? atual.atendenteId;
  // Precisa poder mexer no agendamento atual e no destino (se trocou de atendente).
  const permitido =
    podeGerenciarAgendamento({ usuarioId: req.user.id, atendenteId: atual.atendenteId, temPermissaoTodos: todos }) &&
    podeGerenciarAgendamento({ usuarioId: req.user.id, atendenteId, temPermissaoTodos: todos });
  if (!permitido) return res.status(403).json({ erro: "Você só pode alterar atendimentos da sua própria agenda" });

  const dados = { ...req.body, atendenteId };
  const problema = await problemaDoAgendamento(dados, id);
  if (problema) return res.status(problema.status).json({ erro: problema.erro });

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      titulo: dados.titulo,
      descricao: dados.descricao,
      inicio: dados.inicio,
      fim: dados.fim,
      atendenteId,
      ticketId: dados.ticketId,
    },
    include: incluir,
  });
  res.json(atualizado);
});

export const excluir = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const atual = await prisma.agendamento.findUnique({ where: { id }, select: { atendenteId: true } });
  if (!atual) return res.status(404).json({ erro: "Agendamento não encontrado" });

  const permitido = podeGerenciarAgendamento({
    usuarioId: req.user.id,
    atendenteId: atual.atendenteId,
    temPermissaoTodos: await gerenciaTodos(req.user),
  });
  if (!permitido) return res.status(403).json({ erro: "Você só pode cancelar atendimentos da sua própria agenda" });

  await prisma.agendamento.delete({ where: { id } });
  res.status(204).send();
});
