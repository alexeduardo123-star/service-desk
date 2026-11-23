import api from "./api";

export default {
  minhas: async () => (await api.get("/permissoes/me")).data,
  listar: async () => (await api.get("/permissoes")).data,
  atualizar: async (papel, permissao, concedida) =>
    (await api.put("/permissoes", { papel, permissao, concedida })).data,
};
