import api from "./api";

export default {
  obter: async (dias = 14) => (await api.get("/dashboard", { params: { dias } })).data,
};
