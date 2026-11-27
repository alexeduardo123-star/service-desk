// Chamados de exemplo dos testes dos cards (TicketCard, KanbanCard e CamposChamado).
// Com o relógio fixo em AGORA, o chamado completo está aberto há 3 dias, com
// SLA de 24 h, então aparece como "SLA vencido".

export const AGORA = new Date("2026-11-27T12:00:00Z");

export function chamadoCompleto(extra = {}) {
  return {
    id: 42,
    titulo: "Impressora do RH não imprime",
    descricao: "Desde ontem a impressora do RH não puxa papel.",
    status: "EM_ANDAMENTO",
    createdAt: "2026-11-24T12:00:00Z",
    closedAt: null,
    categoria: { id: 5, nome: "Hardware" },
    assunto: { id: 8, nome: "Impressoras" },
    departamento: { id: 2, nome: "Recursos Humanos" },
    prioridade: { id: 4, nome: "Urgente", nivel: 4, slaHoras: 24 },
    aprovacaoStatus: "APROVADA",
    solicitante: { id: 10, nome: "Ana" },
    tecnico: { id: 20, nome: "Bruno" },
    colaboradores: [
      { id: 21, nome: "Carla" },
      { id: 22, nome: "Davi" },
    ],
    ...extra,
  };
}

// Chamado de antes de existirem assunto, setor, aprovação e colaboradores.
export function chamadoAntigo(extra = {}) {
  return {
    id: 3,
    titulo: "Mouse quebrado",
    descricao: "",
    status: "ABERTO",
    createdAt: "2026-11-27T11:30:00Z",
    closedAt: null,
    categoria: { id: 5, nome: "Hardware" },
    prioridade: { id: 1, nome: "Baixa", nivel: 1, slaHoras: 72 },
    solicitante: { id: 10, nome: "Ana" },
    tecnico: null,
    ...extra,
  };
}
