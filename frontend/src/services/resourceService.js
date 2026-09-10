import api from "./api";

// Fábrica de service para recursos REST simples (listar/buscar/criar/
// atualizar/excluir), usada pelos catálogos (departamentos, categorias,
// prioridades, equipamentos) que seguem o mesmo padrão de rota no backend.
export function createResourceService(basePath) {
  return {
    listar: async () => (await api.get(basePath)).data,
    buscar: async (id) => (await api.get(`${basePath}/${id}`)).data,
    criar: async (dados) => (await api.post(basePath, dados)).data,
    atualizar: async (id, dados) => (await api.put(`${basePath}/${id}`, dados)).data,
    excluir: async (id) => api.delete(`${basePath}/${id}`),
  };
}
