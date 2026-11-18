import api from "./api";
import { createResourceService } from "./resourceService";

const base = createResourceService("/tickets");

export default {
  ...base,
  listar: async (filtros = {}) => (await api.get("/tickets", { params: filtros })).data,
  alterarStatus: async (id, status) => (await api.patch(`/tickets/${id}/status`, { status })).data,
  suspender: async (id, motivo) => (await api.patch(`/tickets/${id}/suspender`, { motivo })).data,
  retomar: async (id) => (await api.patch(`/tickets/${id}/retomar`)).data,
  atribuir: async (id, tecnicoId) => (await api.patch(`/tickets/${id}/atribuir`, { tecnicoId })).data,
};
