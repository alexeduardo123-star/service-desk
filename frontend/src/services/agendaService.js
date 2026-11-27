import api from "./api";

// periodo: { inicio, fim } em ISO; atendenteId é opcional.
export default {
  listar: async ({ inicio, fim, atendenteId }) =>
    (await api.get("/agenda", { params: { inicio, fim, ...(atendenteId && { atendenteId }) } })).data,
  criar: async (dados) => (await api.post("/agenda", dados)).data,
  atualizar: async (id, dados) => (await api.put(`/agenda/${id}`, dados)).data,
  excluir: async (id) => api.delete(`/agenda/${id}`),
};
