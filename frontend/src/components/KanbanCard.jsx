import { Link } from "react-router-dom";
import { COR_POR_NIVEL } from "../constants/cores";
import { STATUS_LABEL } from "../constants/labels";
import { COLUNAS_KANBAN, slaVencido } from "../utils/kanban";
import { tempoRelativo } from "../utils/tempoRelativo";

export default function KanbanCard({ ticket, podeMover, arrastando, onDragStart, onDragEnd, onMover }) {
  const atrasado = slaVencido(ticket);

  return (
    <article
      draggable={podeMover}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(ticket.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(ticket.id);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${podeMover ? "cursor-grab active:cursor-grabbing" : ""} ${arrastando ? "opacity-40" : ""}`}
      style={{ borderLeft: `4px solid ${COR_POR_NIVEL[ticket.prioridade?.nivel] ?? "#9ca3af"}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/tickets/${ticket.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
          <span className="text-gray-400">#{ticket.id}</span> {ticket.titulo}
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{ticket.categoria?.nome}</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{ticket.prioridade?.nome}</span>
        {atrasado && <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">SLA vencido</span>}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <p>Solicitante: {ticket.solicitante?.nome}</p>
        <p>{ticket.tecnico ? `Técnico: ${ticket.tecnico.nome}` : "Sem técnico"}</p>
        <p className="text-gray-400">Aberto {tempoRelativo(ticket.createdAt)}</p>
      </div>

      {podeMover && (
        <select
          aria-label={`Mover chamado ${ticket.id} para`}
          value={ticket.status}
          onChange={(e) => onMover(ticket, e.target.value)}
          className="mt-2 w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-600"
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
