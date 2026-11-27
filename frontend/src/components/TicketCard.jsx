import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { EtiquetasChamado, PessoasChamado, PrioridadeBadge, RodapeChamado, TituloChamado } from "./CamposChamado";

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <TituloChamado ticket={ticket} />
        </h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={ticket.status} />
          <PrioridadeBadge prioridade={ticket.prioridade} />
        </div>
      </div>
      {ticket.descricao && <p className="line-clamp-2 text-sm text-gray-600">{ticket.descricao}</p>}
      <EtiquetasChamado ticket={ticket} />
      <PessoasChamado ticket={ticket} />
      <RodapeChamado ticket={ticket} />
    </Link>
  );
}
