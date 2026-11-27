import AprovacaoBadge from "./AprovacaoBadge";
import { corDaPrioridade, textoColaboradores } from "../utils/camposChamado";
import { formatDate } from "../utils/formatDate";
import { slaVencido } from "../utils/kanban";
import { tempoAberto } from "../utils/tempoAberto";

// Partes iguais dos cards de chamado (TicketCard na lista e KanbanCard no
// quadro), para os dois mostrarem os mesmos campos na mesma ordem. Tudo aceita
// chamado antigo, sem assunto, setor, atendente ou colaboradores.

const ETIQUETA = "rounded bg-gray-100 px-1.5 py-0.5 text-gray-600";

// "#12 Título do chamado".
export function TituloChamado({ ticket }) {
  return (
    <>
      <span className="font-normal text-gray-500">#{ticket.id}</span> {ticket.titulo}
    </>
  );
}

// Nome da prioridade com a bolinha na cor do nível. O nome fica escrito para a
// informação não depender só da cor.
export function PrioridadeBadge({ prioridade }) {
  if (!prioridade?.nome) return null;
  const cor = corDaPrioridade(prioridade);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-gray-700"
      style={{ borderColor: cor }}
      title={`Prioridade: ${prioridade.nome}`}
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
      {prioridade.nome}
    </span>
  );
}

// Assunto (ou a categoria, em chamado sem assunto), setor, aprovação e SLA.
export function EtiquetasChamado({ ticket }) {
  const classificacao = ticket.assunto?.nome
    ? { texto: ticket.assunto.nome, titulo: "Assunto" }
    : ticket.categoria?.nome
      ? { texto: ticket.categoria.nome, titulo: "Categoria" }
      : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs empty:hidden">
      {classificacao && (
        <span className={ETIQUETA} title={`${classificacao.titulo}: ${classificacao.texto}`}>{classificacao.texto}</span>
      )}
      {ticket.departamento?.nome && (
        <span className={ETIQUETA} title={`Setor: ${ticket.departamento.nome}`}>{ticket.departamento.nome}</span>
      )}
      <AprovacaoBadge ticket={ticket} />
      {slaVencido(ticket) && <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">SLA vencido</span>}
    </div>
  );
}

// Solicitante, atendente responsável e quantos colaboradores ajudam.
export function PessoasChamado({ ticket }) {
  const colaboradores = textoColaboradores(ticket.colaboradores);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
      <span>Solicitante: {ticket.solicitante?.nome ?? "—"}</span>
      <span>{ticket.tecnico?.nome ? `Atendente: ${ticket.tecnico.nome}` : "Sem atendente"}</span>
      {colaboradores && (
        <span title={ticket.colaboradores.map((c) => c.nome).filter(Boolean).join(", ")}>{colaboradores}</span>
      )}
    </div>
  );
}

// Há quanto tempo está aberto e quando foi aberto.
export function RodapeChamado({ ticket }) {
  const tempo = tempoAberto(ticket);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-gray-500">
      {tempo && <span className="font-medium text-gray-500">{tempo}</span>}
      {ticket.createdAt && <span>Aberto em {formatDate(ticket.createdAt)}</span>}
    </div>
  );
}
