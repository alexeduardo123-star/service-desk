import prisma from "../config/prisma.js";
import { enviarEmail } from "./mailer.js";
import { NOME_APP } from "../config/marca.js";

// Cada tipo automático de notificação é controlado por uma preferência em
// ConfiguracaoUsuario (tela de Configurações > Notificações). Tipos que não
// estão aqui (ex.: SISTEMA, comunicados do admin) são sempre entregues.
export const PREFERENCIA_POR_TIPO = {
  TICKET_CRIADO: "notificarNovoTicket",
  TICKET_ATRIBUIDO: "notificarAtribuicao",
  // Encaminhar e entrar como colaborador também são "o chamado passou por você".
  TICKET_ENCAMINHADO: "notificarAtribuicao",
  TICKET_COLABORADOR: "notificarAtribuicao",
  TICKET_STATUS: "notificarStatus",
  TICKET_COMENTARIO: "notificarComentario",
};

// Usuário sem linha de configuração usa os defaults do schema (tudo ligado).
export function deveNotificar(configuracao, tipo) {
  const chave = PREFERENCIA_POR_TIPO[tipo];
  if (!chave || !configuracao) return true;
  return configuracao[chave] !== false;
}

// Remove duplicados, nulos, inativos e o próprio autor da ação (ninguém
// precisa ser avisado do que acabou de fazer).
export function filtrarDestinatarios(destinatarios, autorId) {
  const vistos = new Set();
  return destinatarios.filter((u) => {
    if (!u || u.id === autorId || u.ativo === false || vistos.has(u.id)) return false;
    vistos.add(u.id);
    return true;
  });
}

// Cria as notificações respeitando as preferências de cada destinatário.
// Nunca lança: uma falha ao notificar não pode derrubar a operação principal
// (abrir/atribuir/comentar chamado), então só registra o erro no console.
export async function notificarUsuarios(
  { destinatarios, tipo, titulo, mensagem, ticketId = null, autorId = null },
  deps = { prisma, enviarEmail }
) {
  try {
    const alvos = filtrarDestinatarios(destinatarios, autorId);
    if (alvos.length === 0) return 0;

    const configs = await deps.prisma.configuracaoUsuario.findMany({
      where: { usuarioId: { in: alvos.map((u) => u.id) } },
    });
    const configPorUsuario = new Map(configs.map((c) => [c.usuarioId, c]));
    const aEntregar = alvos.filter((u) => deveNotificar(configPorUsuario.get(u.id), tipo));
    if (aEntregar.length === 0) return 0;

    await deps.prisma.notificacao.createMany({
      data: aEntregar.map((u) => ({ usuarioId: u.id, tipo, titulo, mensagem, ticketId })),
    });

    for (const u of aEntregar) {
      if (u.email && configPorUsuario.get(u.id)?.notificarEmail) {
        deps
          .enviarEmail({ to: u.email, subject: `${titulo} — ${NOME_APP}`, text: mensagem })
          .catch((err) => console.error("[notificar] falha ao enviar email:", err.message));
      }
    }
    return aEntregar.length;
  } catch (err) {
    console.error("[notificar] falha ao criar notificações:", err);
    return 0;
  }
}

const SELECT_DESTINATARIO = { id: true, nome: true, email: true, ativo: true };

// Admins e técnicos ativos (quem precisa saber de chamados novos).
export function buscarEquipe(deps = { prisma }) {
  return deps.prisma.usuario.findMany({
    where: { papel: { in: ["ADMIN", "TECNICO"] }, ativo: true },
    select: SELECT_DESTINATARIO,
  });
}

// Gestores ativos do setor do chamado (quem aprova). Sem setor, ou sem gestor
// cadastrado nele, o pedido vai para os administradores para não ficar parado.
export async function buscarGestoresDoSetor(departamentoId, deps = { prisma }) {
  if (departamentoId) {
    const gestores = await deps.prisma.usuario.findMany({
      where: { papel: "GESTOR", ativo: true, departamentoId },
      select: SELECT_DESTINATARIO,
    });
    if (gestores.length > 0) return gestores;
  }
  return deps.prisma.usuario.findMany({
    where: { papel: "ADMIN", ativo: true },
    select: SELECT_DESTINATARIO,
  });
}

export function buscarUsuario(id, deps = { prisma }) {
  if (!id) return Promise.resolve(null);
  return deps.prisma.usuario.findUnique({ where: { id }, select: SELECT_DESTINATARIO });
}

// Colaboradores do chamado, já como destinatários.
export async function buscarColaboradores(ticketId, deps = { prisma }) {
  if (!ticketId) return [];
  const registros = await deps.prisma.ticketColaborador.findMany({
    where: { ticketId },
    select: { usuario: { select: SELECT_DESTINATARIO } },
  });
  return registros.map((r) => r.usuario);
}
