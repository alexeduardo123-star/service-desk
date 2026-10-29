import api from "./api";

// Avisa o sino do cabeçalho (SinoNotificacoes) que o contador pode ter mudado.
export const EVENTO_NOTIFICACOES = "notificacoes:atualizadas";
const avisarMudanca = () => window.dispatchEvent(new Event(EVENTO_NOTIFICACOES));

export default {
  listar: async (filtros = {}) => (await api.get("/notificacoes", { params: filtros })).data,
  buscar: async (id) => (await api.get(`/notificacoes/${id}`)).data,
  contarNaoLidas: async () => (await api.get("/notificacoes/nao-lidas/contagem")).data.total,

  criar: async (dados) => (await api.post("/notificacoes", dados)).data,

  marcarLida: async (id, lida = true) => {
    const data = (await api.patch(`/notificacoes/${id}/lida`, { lida })).data;
    avisarMudanca();
    return data;
  },
  marcarTodasLidas: async () => {
    const data = (await api.patch("/notificacoes/ler-todas")).data;
    avisarMudanca();
    return data;
  },

  excluir: async (id) => {
    await api.delete(`/notificacoes/${id}`);
    avisarMudanca();
  },
  excluirLidas: async () => {
    const data = (await api.delete("/notificacoes/lidas")).data;
    avisarMudanca();
    return data;
  },
};
