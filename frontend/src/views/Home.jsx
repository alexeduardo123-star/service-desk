import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";
import TicketCard from "../components/TicketCard";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";

export default function Home() {
  const [tickets, setTickets] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    ticketService
      .listar()
      .then(setTickets)
      .finally(() => setCarregando(false));
  }, []);

  const contagem = Object.fromEntries(
    Object.values(StatusTicket).map((status) => [status, tickets.filter((t) => t.status === status).length])
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.values(StatusTicket).map((status) => (
          <div key={status} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">{STATUS_LABEL[status]}</p>
            <p className="text-2xl font-bold text-gray-900">{carregando ? "…" : contagem[status]}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chamados recentes</h2>
        <Link to="/tickets/novo" className="text-sm font-medium text-blue-600 hover:underline">
          Abrir novo chamado
        </Link>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.slice(0, 6).map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length === 0 && <p className="text-sm text-gray-400">Nenhum chamado encontrado.</p>}
        </div>
      )}
    </div>
  );
}
