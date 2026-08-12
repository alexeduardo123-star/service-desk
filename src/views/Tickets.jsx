import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";
import TicketCard from "../components/TicketCard";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    ticketService
      .listar(statusFiltro ? { status: statusFiltro } : {})
      .then(setTickets)
      .finally(() => setCarregando(false));
  }, [statusFiltro]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Chamados</h1>
        <Link to="/tickets/novo" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Novo chamado
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setStatusFiltro("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === "" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          Todos
        </button>
        {Object.values(StatusTicket).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFiltro(status)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === status ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length === 0 && <p className="text-sm text-gray-400">Nenhum chamado encontrado.</p>}
        </div>
      )}
    </div>
  );
}
