// Regras dos colaboradores do chamado: atendentes que ajudam no atendimento sem
// ser o responsável (tecnicoId). As funções de erro devolvem a mensagem para a
// API, ou null quando a ação pode seguir.

const CHAMADO_FECHADO = "Chamado fechado não aceita mudanças nos colaboradores";

// `usuario` é quem vai entrar (ou null, se o id não existe); `idsColaboradores`
// são os usuarioId que já colaboram no chamado.
export function erroAoAdicionarColaborador(ticket, usuario, idsColaboradores = []) {
  if (ticket.status === "FECHADO") return CHAMADO_FECHADO;
  if (!usuario) return "Usuário não encontrado";
  if (usuario.id === ticket.solicitanteId) return "O solicitante do chamado não pode ser colaborador";
  if (usuario.id === ticket.tecnicoId) return "O atendente responsável não pode ser colaborador";
  if (usuario.papel === "SOLICITANTE") return "Usuários com perfil solicitante não podem ser colaboradores";
  if (!usuario.ativo) return "Usuário inativo não pode ser colaborador";
  if (idsColaboradores.includes(usuario.id)) return "Este usuário já é colaborador do chamado";
  return null;
}

export function erroAoRemoverColaborador(ticket) {
  return ticket.status === "FECHADO" ? CHAMADO_FECHADO : null;
}

// Quem vira responsável (por encaminhamento ou atribuição) deixa de ser
// colaborador: a mesma pessoa não ocupa os dois papéis no chamado. Devolve o
// filtro do deleteMany, que não faz nada se ela não era colaboradora.
export function colaboradorQueViraResponsavel(ticketId, novoResponsavelId) {
  return { ticketId, usuarioId: novoResponsavelId };
}

// Os registros vêm do banco como { usuario: { id, nome } }; a API devolve só a
// pessoa, que é o que as telas usam.
export function achatarColaboradores(ticket) {
  if (!ticket?.colaboradores) return ticket;
  return { ...ticket, colaboradores: ticket.colaboradores.map((c) => c.usuario) };
}

export function comentarioColaboradorAdicionado(autor, usuario) {
  return `${autor.nome} adicionou ${usuario.nome} como colaborador`;
}

export function comentarioColaboradorRemovido(autor, usuario) {
  return `${autor.nome} removeu ${usuario.nome} dos colaboradores`;
}
