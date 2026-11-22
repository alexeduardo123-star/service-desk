import api from "./api";

export default {
  listar: async () => (await api.get("/permissoes")).data,
  atualizarPerfil: async (papel, permissoes) =>
    (await api.put(`/permissoes/${papel}`, { permissoes })).data,
};
