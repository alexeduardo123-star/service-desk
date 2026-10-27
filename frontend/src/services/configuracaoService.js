import api from "./api";

export default {
  obter: async () => (await api.get("/configuracoes/me")).data,
  atualizar: async (dados) => (await api.put("/configuracoes/me", dados)).data,
  restaurarPadrao: async () => (await api.delete("/configuracoes/me")).data,
};
