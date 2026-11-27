// Funções da agenda (calendário mensal). Tudo é calculado no fuso horário
// escolhido nas preferências do usuário, o mesmo usado por formatDate.
import { lerPreferencias } from "./preferencias";

export const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
export const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const fusoAtual = () => lerPreferencias().fusoHorario;
const dois = (n) => String(n).padStart(2, "0");

// Ano, mês (1-12), dia, hora e minuto de um instante, no fuso informado.
export function partesNoFuso(instante, fuso = fusoAtual()) {
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const partes = Object.fromEntries(formatador.formatToParts(new Date(instante)).map((p) => [p.type, Number(p.value)]));
  return { ano: partes.year, mes: partes.month, dia: partes.day, hora: partes.hour, minuto: partes.minute };
}

export function chaveDoDia(instante, fuso = fusoAtual()) {
  const { ano, mes, dia } = partesNoFuso(instante, fuso);
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

export function horaDoDia(instante, fuso = fusoAtual()) {
  const { hora, minuto } = partesNoFuso(instante, fuso);
  return `${dois(hora)}:${dois(minuto)}`;
}

// "AAAA-MM-DDTHH:mm" (valor de <input type="datetime-local">) -> ISO (UTC),
// interpretando o texto no fuso informado. Devolve "" se o texto for inválido.
export function instanteDeLocal(texto, fuso = fusoAtual()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(texto ?? "");
  if (!m) return "";
  const [ano, mes, dia, hora, minuto] = m.slice(1).map(Number);
  const alvo = Date.UTC(ano, mes - 1, dia, hora, minuto);

  // Descobre o deslocamento do fuso nesse horário (duas passadas cobrem a
  // virada de horário de verão).
  let instante = alvo;
  for (let i = 0; i < 2; i += 1) {
    const p = partesNoFuso(instante, fuso);
    const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
    instante += alvo - comoUtc;
  }
  return new Date(instante).toISOString();
}

// ISO -> "AAAA-MM-DDTHH:mm" no fuso informado.
export function localDeInstante(iso, fuso = fusoAtual()) {
  if (!iso) return "";
  const { ano, mes, dia, hora, minuto } = partesNoFuso(iso, fuso);
  return `${ano}-${dois(mes)}-${dois(dia)}T${dois(hora)}:${dois(minuto)}`;
}

// Mês exibido: { ano, mes } com mes de 1 a 12. Navega com deslocamento em meses.
export function somarMeses({ ano, mes }, delta) {
  const indice = ano * 12 + (mes - 1) + delta;
  return { ano: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function mesDeHoje(agora = new Date(), fuso = fusoAtual()) {
  const { ano, mes } = partesNoFuso(agora, fuso);
  return { ano, mes };
}

// Grade do mês: semanas completas (domingo a sábado), 5 ou 6 linhas.
// Cada dia: { chave: "AAAA-MM-DD", dia, doMes }.
export function diasDoMes({ ano, mes }) {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimo = new Date(Date.UTC(ano, mes, 0));
  const inicio = new Date(primeiro);
  inicio.setUTCDate(1 - primeiro.getUTCDay());
  const fim = new Date(ultimo);
  fim.setUTCDate(ultimo.getUTCDate() + (6 - ultimo.getUTCDay()));

  const dias = [];
  for (let d = new Date(inicio); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push({
      chave: `${d.getUTCFullYear()}-${dois(d.getUTCMonth() + 1)}-${dois(d.getUTCDate())}`,
      dia: d.getUTCDate(),
      doMes: d.getUTCMonth() === mes - 1,
    });
  }
  return dias;
}

// Período (ISO) para consultar a API cobrindo a grade inteira. Uma folga de um
// dia para cada lado absorve a diferença de fuso; o excesso é ignorado ao agrupar.
export function periodoDaGrade(dias) {
  const [a, b] = [dias[0].chave, dias[dias.length - 1].chave];
  const inicio = new Date(`${a}T00:00:00Z`);
  const fim = new Date(`${b}T00:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - 1);
  fim.setUTCDate(fim.getUTCDate() + 2);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

// { "AAAA-MM-DD": { prazos: [], agendamentos: [] } }. O atendimento fica no dia
// em que começa; o prazo de SLA no dia em que vence.
export function agruparPorDia(prazos = [], agendamentos = [], fuso = fusoAtual()) {
  const mapa = {};
  const dia = (chave) => (mapa[chave] ??= { prazos: [], agendamentos: [] });
  for (const prazo of prazos) dia(chaveDoDia(prazo.prazo, fuso)).prazos.push(prazo);
  for (const agendamento of agendamentos) dia(chaveDoDia(agendamento.inicio, fuso)).agendamentos.push(agendamento);
  return mapa;
}

// "segunda-feira, 2 de novembro" a partir da chave do dia.
export function tituloDoDia(chave) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  const semana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  const nomes = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  return `${nomes[semana]}, ${dia} de ${NOMES_MESES[mes - 1]}`;
}

// Quem pode alterar/cancelar este atendimento na tela (o servidor confere de novo).
export function podeAlterarAgendamento(usuario, agendamento, { gerenciar, todos }) {
  return Boolean(gerenciar) && (Boolean(todos) || agendamento.atendente?.id === usuario?.id);
}
