import api from "./api";
import { createResourceService } from "./resourceService";

const base = createResourceService("/usuarios");

export default {
  ...base,
  me: async () => (await api.get("/usuarios/me")).data,
};
