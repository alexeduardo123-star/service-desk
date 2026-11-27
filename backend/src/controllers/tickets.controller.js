import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { montarFiltroTickets, montarOrdenacaoTickets, fechadosNoFim } from "../utils/filtrosTicket.js";
import {
  avisarTicketCriado,
  avisarTicketAtribuido,
  avisarStatusAlterado,
  avisarTicketSuspenso,
  avisarTicketRetomado,
  avisarAprovacaoPendente,
  avisarAprovacaoDecidida,
  comentarioDeEncaminhamento,
  comentarioDeSuspensao,
  erroAoEncaminhar,
  erroAoRetomar,
  erroAoSuspender,
  statusAoEncaminhar,
} from "../utils/eventosTicket.js";
import { validarRespostas } from "../utils/respostasFormulario.js";
import {
  statusInicialAprovacao,
  erroDeAprovacao,
  erroAoDecidir,
  podeDecidirAprovacao,
  comentarioDeAprovacao,
  comentarioDeRejeicao,
} from "../utils/aprovacao.js";
import {
  achatarColaboradores,
  colaboradorQueViraResponsavel,
  comentarioColaboradorAdicionado,
  comentarioColaboradorRemovido,
  erroAoAdicionarColaborador,
  erroAoRemoverColaborador,
} from "../utils/colaboradores.js";

// Colaboradores como vêm do banco; achatarColaboradores deixa só { id, nome }.
const colaboradoresSelect = {
  select: { usuario: { select: { id: true, nome: true } } },
  orderBy: { createdAt: "asc" },
};

const include = {
  solicitante: { select: { id: true, nome: true } },
  tecnico: { select: { id: true, nome: true } },
  categoria: true,
  prioridade: true,
  equipamento: true,
  departamento: true,
  assunto: { select: { id: true, nome: true } },
  aprovador: { select: { id: true, nome: true } },
};

function podeVer(ticket, user) {
  return user.papel !== "SOLICITANTE" || ticket.solicitanteId === user.id;
}

export const listar = asyncHandler(async (req, res) => {
  const where = montarFiltroTickets(req.query, req.user);
  const { orderBy } = montarOrdenacaoTickets(req.query);
  const tickets = await prisma.ticket.findMany({ where, include: { ...include, colaboradores: colaboradoresSelect }, orderBy });
  res.json(fechadosNoFim(tickets).map(achatarColaboradores));
});

export const buscar = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      ...include,
      colaboradores: colaboradoresSelect,
      comentarios: { include: { usuario: { select: { id: true, nome: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  if (!podeVer(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });
  res.json(achatarColaboradores(ticket));
});

export const criar = asyncHandler(async (req, res) => {
  const { titulo, descricao, categoriaId, equipamentoId, departamentoId, assuntoId } = req.body;
  let { prioridadeId } = req.body;
  let respostasFormulario = null;

  // Com assunto escolhido, a prioridade é a cadastrada nele (o que veio do
  // cliente é ignorado). Sem assunto, vale a prioridade informada.
  if (assuntoId) {
    const assunto = await prisma.assunto.findUnique({
      where: { id: assuntoId },
      select: {
        id: true,
        ativo: true,
        prioridadeId: true,
        formulario: {
          select: {
            ativo: true,
            campos: { orderBy: { ordem: "asc" }, select: { id: true, rotulo: true, tipo: true, obrigatorio: true, opcoes: true } },
          },
        },
      },
    });
    if (!assunto || !assunto.ativo) return res.status(400).json({ erro: "Assunto inválido ou inativo" });
    prioridadeId = assunto.prioridadeId ?? prioridadeId;

    // O assunto pode ter um formulário (dados extras que o atendimento precisa).
    if (assunto.formulario?.ativo) {
      const validacao = validarRespostas(assunto.formulario.campos, req.body.respostas ?? {});
      if (validacao.erro) return res.status(400).json({ erro: validacao.erro });
      respostasFormulario = validacao.respostas;
    }
  }
  if (!prioridadeId) return res.status(400).json({ erro: "Informe a prioridade do chamado" });

  // Categoria que exige aprovação: o chamado nasce pendente.
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId }, select: { exigeAprovacao: true } });

  const ticket = await prisma.ticket.create({
    data: {
      titulo,
      aprovacaoStatus: statusInicialAprovacao(categoria),
      descricao,
      categoriaId,
      prioridadeId,
      assuntoId: assuntoId || null,
      respostasFormulario: respostasFormulario ?? undefined,
      equipamentoId: equipamentoId || null,
      departamentoId: departamentoId || null,
      solicitanteId: req.user.id,
    },
    include,
  });
  if (ticket.aprovacaoStatus === "PENDENTE") avisarAprovacaoPendente(ticket, req.user);
  else avisarTicketCriado(ticket, req.user);
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
  const atual = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!atual) return res.status(404).json({ erro: "Não encontrado" });
  const bloqueio = erroDeAprovacao(atual);
  if (bloqueio) return res.status(409).json({ erro: bloqueio });

  // Ao fechar registra a data; ao reabrir (arrastar de volta no kanban, por
  // exemplo) limpa, senão o chamado ficaria "aberto" com data de fechamento.
  const data = { status, closedAt: status === "FECHADO" ? new Date() : null };

  const ticket = await prisma.ticket.update({
    where: { id: atual.id },
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
  const erro = erroDeAprovacao(atual) || erroAoSuspender(atual);
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
  const erro = erroDeAprovacao(atual) || erroAoRetomar(atual);
  if (erro) return res.status(409).json({ erro });

  const ticket = await prisma.ticket.update({ where: { id: atual.id }, data: { status: "EM_ANDAMENTO" }, include });
  avisarTicketRetomado(ticket, req.user);
  res.json(ticket);
});

export const atribuir = asyncHandler(async (req, res) => {
  const { tecnicoId } = req.body;
  const atual = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!atual) return res.status(404).json({ erro: "Não encontrado" });
  const bloqueio = erroDeAprovacao(atual);
  if (bloqueio) return res.status(409).json({ erro: bloqueio });

  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: atual.id },
      data: { tecnicoId, status: "EM_ANDAMENTO" },
      include,
    }),
    prisma.ticketColaborador.deleteMany({ where: colaboradorQueViraResponsavel(atual.id, tecnicoId) }),
  ]);
  avisarTicketAtribuido(ticket, req.user);
  res.json(ticket);
});

// Passa o chamado para outro atendente. O motivo é obrigatório (validado em
// encaminharSchema) e fica no histórico; troca e comentário mudam juntos.
export const encaminhar = asyncHandler(async (req, res) => {
  const { tecnicoId, motivo } = req.body;
  const atual = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: { tecnico: { select: { id: true, nome: true } } },
  });
  if (!atual) return res.status(404).json({ erro: "Não encontrado" });
  const bloqueio = erroDeAprovacao(atual);
  if (bloqueio) return res.status(409).json({ erro: bloqueio });

  const destino = await prisma.usuario.findUnique({
    where: { id: tecnicoId },
    select: { id: true, nome: true, papel: true, ativo: true },
  });
  const erro = erroAoEncaminhar(atual, destino);
  if (erro) return res.status(409).json({ erro });

  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: atual.id },
      data: { tecnicoId: destino.id, status: statusAoEncaminhar(atual) },
      include,
    }),
    prisma.comentario.create({
      data: {
        ticketId: atual.id,
        usuarioId: req.user.id,
        mensagem: comentarioDeEncaminhamento(atual.tecnico, destino, motivo),
      },
    }),
    prisma.ticketColaborador.deleteMany({ where: colaboradorQueViraResponsavel(atual.id, destino.id) }),
  ]);
  avisarTicketAtribuido(ticket, req.user);
  res.json(ticket);
});

async function colaboradoresDoTicket(ticketId) {
  const registros = await prisma.ticketColaborador.findMany({ where: { ticketId }, ...colaboradoresSelect });
  return registros.map((c) => c.usuario);
}

export const listarColaboradores = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  res.json(await colaboradoresDoTicket(ticket.id));
});

// Adiciona um colaborador e registra no histórico; inclusão e comentário mudam
// juntos. Devolve a lista atualizada de colaboradores.
export const adicionarColaborador = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { usuarioId } = req.body;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { colaboradores: { select: { usuarioId: true } } },
  });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, papel: true, ativo: true },
  });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
  const erro =
    erroDeAprovacao(ticket) || erroAoAdicionarColaborador(ticket, usuario, ticket.colaboradores.map((c) => c.usuarioId));
  if (erro) return res.status(409).json({ erro });

  await prisma.$transaction([
    prisma.ticketColaborador.create({ data: { ticketId, usuarioId, adicionadoPorId: req.user.id } }),
    prisma.comentario.create({
      data: { ticketId, usuarioId: req.user.id, mensagem: comentarioColaboradorAdicionado(req.user, usuario) },
    }),
  ]);
  res.status(201).json(await colaboradoresDoTicket(ticketId));
});

export const removerColaborador = asyncHandler(async (req, res) => {
  const { id: ticketId, usuarioId } = req.params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, aprovacaoStatus: true },
  });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  const erro = erroDeAprovacao(ticket) || erroAoRemoverColaborador(ticket);
  if (erro) return res.status(409).json({ erro });

  const colaborador = await prisma.ticketColaborador.findUnique({
    where: { ticketId_usuarioId: { ticketId, usuarioId } },
    select: { id: true, usuario: { select: { id: true, nome: true } } },
  });
  if (!colaborador) return res.status(404).json({ erro: "Este usuário não é colaborador do chamado" });

  await prisma.$transaction([
    prisma.ticketColaborador.delete({ where: { id: colaborador.id } }),
    prisma.comentario.create({
      data: { ticketId, usuarioId: req.user.id, mensagem: comentarioColaboradorRemovido(req.user, colaborador.usuario) },
    }),
  ]);
  res.json(await colaboradoresDoTicket(ticketId));
});

// Carrega o chamado e confere se este usuário pode decidir a aprovação.
// Devolve { ticket } ou { erro: { status, mensagem } }.
async function prepararDecisao(req) {
  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) }, include });
  if (!ticket) return { erro: { status: 404, mensagem: "Não encontrado" } };

  const erro = erroAoDecidir(ticket);
  if (erro) return { erro: { status: 409, mensagem: erro } };

  // O token não traz o setor; lê do banco para conferir se o gestor é da área.
  const aprovador = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { papel: true, departamentoId: true },
  });
  if (!podeDecidirAprovacao(aprovador, ticket)) {
    return { erro: { status: 403, mensagem: "Só o gestor do setor do chamado pode decidir a aprovação" } };
  }
  return { ticket };
}

export const aprovar = asyncHandler(async (req, res) => {
  const { ticket: atual, erro } = await prepararDecisao(req);
  if (erro) return res.status(erro.status).json({ erro: erro.mensagem });

  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: atual.id },
      data: { aprovacaoStatus: "APROVADA", aprovadorId: req.user.id, aprovacaoEm: new Date() },
      include,
    }),
    prisma.comentario.create({
      data: { ticketId: atual.id, usuarioId: req.user.id, mensagem: comentarioDeAprovacao(req.user.nome) },
    }),
  ]);
  avisarAprovacaoDecidida(ticket, req.user, true);
  // Agora que foi aprovado, a equipe de atendimento fica sabendo do chamado.
  avisarTicketCriado(ticket, ticket.solicitante);
  res.json(ticket);
});

// Rejeitar encerra o chamado: o motivo fica no histórico e o solicitante é avisado.
export const rejeitar = asyncHandler(async (req, res) => {
  const { ticket: atual, erro } = await prepararDecisao(req);
  if (erro) return res.status(erro.status).json({ erro: erro.mensagem });

  const { motivo } = req.body;
  const agora = new Date();
  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: atual.id },
      data: {
        aprovacaoStatus: "REJEITADA",
        aprovadorId: req.user.id,
        aprovacaoEm: agora,
        aprovacaoMotivo: motivo,
        status: "FECHADO",
        closedAt: agora,
      },
      include,
    }),
    prisma.comentario.create({
      data: { ticketId: atual.id, usuarioId: req.user.id, mensagem: comentarioDeRejeicao(req.user.nome, motivo) },
    }),
  ]);
  avisarAprovacaoDecidida(ticket, req.user, false, motivo);
  res.json(ticket);
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.ticket.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
