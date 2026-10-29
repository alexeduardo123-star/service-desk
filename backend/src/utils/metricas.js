// Cálculo das métricas do dashboard e dos relatórios a partir de uma lista de
// chamados já carregada. Mantido como função pura (sem acesso ao banco) para
// ser fácil de testar e reaproveitar nos dois lugares.

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;
const STATUS = ["ABERTO", "EM_ANDAMENTO", "FECHADO"];

// Fuso padrão para agrupar por dia: Brasília (UTC-3), em minutos.
const OFFSET_PADRAO_MIN = -180;

export function horasEntre(inicio, fim) {
  return (new Date(fim).getTime() - new Date(inicio).getTime()) / HORA_MS;
}

// Chamado em aberto cujo prazo de SLA (horas da prioridade) já passou.
export function slaVencido(ticket, agora = new Date()) {
  if (ticket.status === "FECHADO" || !ticket.prioridade?.slaHoras) return false;
  return horasEntre(ticket.createdAt, agora) > ticket.prioridade.slaHoras;
}

// Chamado fechado dentro do prazo? null quando não dá para avaliar.
export function fechadoNoPrazo(ticket) {
  if (ticket.status !== "FECHADO" || !ticket.closedAt || !ticket.prioridade?.slaHoras) return null;
  return horasEntre(ticket.createdAt, ticket.closedAt) <= ticket.prioridade.slaHoras;
}

export function chaveDia(data, offsetMin = OFFSET_PADRAO_MIN) {
  return new Date(new Date(data).getTime() + offsetMin * 60000).toISOString().slice(0, 10);
}

function contarPor(tickets, extrairChave) {
  const mapa = new Map();
  for (const t of tickets) {
    const chave = extrairChave(t);
    if (chave == null) continue;
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return mapa;
}

const arredondar = (n, casas = 1) => (n == null ? null : Number(n.toFixed(casas)));

export function calcularMetricas(tickets, { agora = new Date(), dias = 14, offsetMin = OFFSET_PADRAO_MIN, incluirTecnicos = true } = {}) {
  const fechados = tickets.filter((t) => t.status === "FECHADO");

  const totais = {
    total: tickets.length,
    abertos: tickets.filter((t) => t.status === "ABERTO").length,
    emAndamento: tickets.filter((t) => t.status === "EM_ANDAMENTO").length,
    fechados: fechados.length,
    semTecnico: tickets.filter((t) => t.status !== "FECHADO" && !t.tecnicoId).length,
    slaVencidos: tickets.filter((t) => slaVencido(t, agora)).length,
  };

  const porStatus = STATUS.map((status) => ({ status, total: tickets.filter((t) => t.status === status).length }));

  const porCategoria = [...contarPor(tickets, (t) => t.categoria?.nome)]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

  const niveis = new Map();
  for (const t of tickets) if (t.prioridade) niveis.set(t.prioridade.nome, t.prioridade.nivel);
  const porPrioridade = [...contarPor(tickets, (t) => t.prioridade?.nome)]
    .map(([nome, total]) => ({ nome, nivel: niveis.get(nome), total }))
    .sort((a, b) => a.nivel - b.nivel);

  // Série diária: do dia (hoje - dias + 1) até hoje, sem buracos.
  const abertosPorDia = contarPor(tickets, (t) => chaveDia(t.createdAt, offsetMin));
  const fechadosPorDia = contarPor(fechados.filter((t) => t.closedAt), (t) => chaveDia(t.closedAt, offsetMin));
  const porDia = [];
  for (let i = dias - 1; i >= 0; i--) {
    const data = chaveDia(new Date(new Date(agora).getTime() - i * DIA_MS), offsetMin);
    porDia.push({ data, abertos: abertosPorDia.get(data) ?? 0, fechados: fechadosPorDia.get(data) ?? 0 });
  }

  const comTempo = fechados.filter((t) => t.closedAt);
  const tempoMedioResolucaoHoras = comTempo.length
    ? arredondar(comTempo.reduce((soma, t) => soma + horasEntre(t.createdAt, t.closedAt), 0) / comTempo.length)
    : null;

  const avaliados = fechados.map(fechadoNoPrazo).filter((v) => v !== null);
  const slaCumpridoPercentual = avaliados.length
    ? arredondar((avaliados.filter(Boolean).length / avaliados.length) * 100, 0)
    : null;

  let topTecnicos = null;
  if (incluirTecnicos) {
    const porTecnico = new Map();
    for (const t of tickets) {
      if (!t.tecnico) continue;
      const atual = porTecnico.get(t.tecnico.nome) ?? { nome: t.tecnico.nome, total: 0, fechados: 0 };
      atual.total += 1;
      if (t.status === "FECHADO") atual.fechados += 1;
      porTecnico.set(t.tecnico.nome, atual);
    }
    topTecnicos = [...porTecnico.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome)).slice(0, 5);
  }

  return { totais, porStatus, porCategoria, porPrioridade, porDia, tempoMedioResolucaoHoras, slaCumpridoPercentual, topTecnicos };
}
