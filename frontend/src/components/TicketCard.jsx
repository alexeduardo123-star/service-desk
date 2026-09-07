import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatDate";

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{ticket.titulo}</h3>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{ticket.descricao}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Categoria: {ticket.categoria?.nome}</span>
        <span>Prioridade: {ticket.prioridade?.nome}</span>
        <span>Solicitante: {ticket.solicitante?.nome}</span>
        {ticket.tecnico && <span>Técnico: {ticket.tecnico.nome}</span>}
        <span>{formatDate(ticket.createdAt)}</span>
      </div>
    </Link>
  );
}
