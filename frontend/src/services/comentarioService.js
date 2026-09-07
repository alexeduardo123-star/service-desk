import api from "./api";

export default {
  listar: async (ticketId) => (await api.get(`/tickets/${ticketId}/comentarios`)).data,
  criar: async (ticketId, mensagem) =>
    (await api.post(`/tickets/${ticketId}/comentarios`, { mensagem })).data,
  excluir: async (ticketId, id) => api.delete(`/tickets/${ticketId}/comentarios/${id}`),
};
