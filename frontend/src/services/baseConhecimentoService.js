import api from "./api";
import { createResourceService } from "./resourceService";

const base = createResourceService("/base-conhecimento");

// Tira os filtros vazios para não mandar "?q=&categoriaId=" à toa.
function semVazios(filtros = {}) {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

export default {
  ...base,
  // filtros: { q, categoriaId }
  listar: async (filtros = {}) => (await api.get("/base-conhecimento", { params: semVazios(filtros) })).data,
  // Até 5 artigos ({ id, titulo, trecho, categoriaId }) para o texto do chamado.
  sugestoes: async ({ texto, categoriaId } = {}) =>
    (await api.get("/base-conhecimento/sugestoes", { params: semVazios({ texto, categoriaId }) })).data,
};
