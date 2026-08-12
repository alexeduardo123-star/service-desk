import api from "./api";
import { createResourceService } from "./resourceService";

const base = createResourceService("/tickets");

export default {
  ...base,
  listar: async (filtros = {}) => (await api.get("/tickets", { params: filtros })).data,
  alterarStatus: async (id, status) => (await api.patch(`/tickets/${id}/status`, { status })).data,
  atribuir: async (id, tecnicoId) => (await api.patch(`/tickets/${id}/atribuir`, { tecnicoId })).data,
};
