import api from "./api";
import { limparFiltros } from "../utils/relatorioFiltros";

export default {
  gerarChamados: async (filtros = {}) => (await api.get("/relatorios/chamados", { params: limparFiltros(filtros) })).data,

  // Filtros salvos (CRUD)
  listarSalvos: async () => (await api.get("/relatorios/salvos")).data,
  buscarSalvo: async (id) => (await api.get(`/relatorios/salvos/${id}`)).data,
  criarSalvo: async (dados) => (await api.post("/relatorios/salvos", dados)).data,
  atualizarSalvo: async (id, dados) => (await api.put(`/relatorios/salvos/${id}`, dados)).data,
  excluirSalvo: async (id) => api.delete(`/relatorios/salvos/${id}`),
};
