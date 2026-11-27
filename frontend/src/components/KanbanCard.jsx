import { Link } from "react-router-dom";
import { STATUS_LABEL } from "../constants/labels";
import { COLUNAS_KANBAN } from "../utils/kanban";
import { corDaPrioridade } from "../utils/camposChamado";
import { EtiquetasChamado, PessoasChamado, PrioridadeBadge, RodapeChamado, TituloChamado } from "./CamposChamado";

// O status não aparece no card: é a própria coluna do quadro.
export default function KanbanCard({ ticket, podeMover, arrastando, onDragStart, onDragEnd, onMover }) {
  return (
    <article
      draggable={podeMover}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(ticket.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(ticket.id);
      }}
      onDragEnd={onDragEnd}
      className={`flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${podeMover ? "cursor-grab active:cursor-grabbing" : ""} ${arrastando ? "opacity-40" : ""}`}
      style={{ borderLeft: `4px solid ${corDaPrioridade(ticket.prioridade)}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/tickets/${ticket.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
          <TituloChamado ticket={ticket} />
        </Link>
        <PrioridadeBadge prioridade={ticket.prioridade} />
      </div>

      <EtiquetasChamado ticket={ticket} />
      <PessoasChamado ticket={ticket} />
      <RodapeChamado ticket={ticket} />

      {podeMover && (
        <select
          aria-label={`Mover chamado ${ticket.id} para`}
          value={ticket.status}
          onChange={(e) => onMover(ticket, e.target.value)}
          className="w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-600"
        >
          {COLUNAS_KANBAN.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      )}
    </article>
  );
}
