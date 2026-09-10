import api from "./api";

export async function login(email, senha) {
  const { data } = await api.post("/auth/login", { email, senha });
  return data;
}

export async function registrar(nome, email, senha) {
  const { data } = await api.post("/auth/registro", { nome, email, senha });
  return data;
}

export async function verificarEmail(email, codigo) {
  const { data } = await api.post("/auth/verificar-email", { email, codigo });
  return data;
}

export async function reenviarVerificacao(email) {
  const { data } = await api.post("/auth/reenviar-verificacao", { email });
  return data;
}

export async function esqueciSenha(email) {
  const { data } = await api.post("/auth/esqueci-senha", { email });
  return data;
}

export async function redefinirSenha(email, codigo, novaSenha) {
  const { data } = await api.post("/auth/redefinir-senha", { email, codigo, novaSenha });
  return data;
}
