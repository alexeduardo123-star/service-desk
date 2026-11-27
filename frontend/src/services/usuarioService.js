import api from "./api";
import { createResourceService } from "./resourceService";

const base = createResourceService("/usuarios");

export default {
  ...base,
  // Técnicos e administradores ativos (id, nome, papel).
  atendentes: async () => (await api.get("/usuarios/atendentes")).data,
  me: async () => (await api.get("/usuarios/me")).data,
  atualizarPerfil: async (dados) => (await api.put("/usuarios/me", dados)).data,
  alterarSenha: async (senhaAtual, novaSenha) =>
    (await api.put("/usuarios/me/senha", { senhaAtual, novaSenha })).data,
};
