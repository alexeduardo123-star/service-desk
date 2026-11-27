const PAPEIS_ATENDENTE = ["ADMIN", "TECNICO"];

// Quem pode atender (ser responsável por assunto ou ter agendamentos): usuário
// que existe, está ativo e é técnico ou administrador.
export function podeSerAtendente(usuario) {
  return Boolean(usuario && usuario.ativo && PAPEIS_ATENDENTE.includes(usuario.papel));
}
