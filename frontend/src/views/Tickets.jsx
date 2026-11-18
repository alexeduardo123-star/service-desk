import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";
import departamentoService from "../services/departamentoService";
import TicketCard from "../components/TicketCard";
import SelectField from "../components/SelectField";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";
import Paginacao from "../components/Paginacao";
import { paginar } from "../utils/paginar";
import { lerPreferencias } from "../utils/preferencias";
import { opcoesSetor } from "../utils/setor";

const ORDENS = [
  { value: "antigos", label: "Mais antigos primeiro" },
  { value: "recentes", label: "Mais recentes primeiro" },
];

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("");
  const [departamentos, setDepartamentos] = useState([]);
  // Padrão: quem está esperando há mais tempo aparece primeiro. A ordenação é
  // feita pelo backend (?ordem=), que também joga os fechados para o fim.
  const [ordem, setOrdem] = useState("antigos");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    // Agendada como microtask para não disparar setState de forma síncrona
    // dentro do corpo do efeito (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => setCarregando(true));
    ticketService
      .listar({ ordem, ...(statusFiltro ? { status: statusFiltro } : {}), ...(setorFiltro ? { departamentoId: setorFiltro } : {}) })
      .then(setTickets)
      .finally(() => setCarregando(false));
  }, [statusFiltro, setorFiltro, ordem]);

  useEffect(() => {
    departamentoService.listar().then(setDepartamentos).catch(() => {});
  }, []);

  function mudarFiltro(status) {
    setStatusFiltro(status);
    setPagina(1);
  }

  function mudarSetor(setor) {
    setSetorFiltro(setor);
    setPagina(1);
  }

  function mudarOrdem(novaOrdem) {
    setOrdem(novaOrdem);
    setPagina(1);
  }

  const { itens, ...paginacao } = paginar(tickets, pagina, lerPreferencias().itensPorPagina);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Chamados</h1>
        <Link to="/tickets/novo" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Novo chamado
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => mudarFiltro("")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === "" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Todos
          </button>
          {Object.values(StatusTicket).map((status) => (
            <button
              key={status}
              onClick={() => mudarFiltro(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === status ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            aria-label="Filtrar por setor"
            className="py-1"
            placeholder="Todos os setores"
            value={setorFiltro}
            onChange={(e) => mudarSetor(e.target.value)}
            options={opcoesSetor(departamentos)}
          />
          <SelectField
            aria-label="Ordenar chamados"
            className="py-1"
            value={ordem}
            onChange={(e) => mudarOrdem(e.target.value)}
            options={ORDENS}
          />
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length === 0 && <p className="text-sm text-gray-400">Nenhum chamado encontrado.</p>}
        </div>
      )}

      {!carregando && <Paginacao {...paginacao} onChange={setPagina} />}
    </div>
  );
}
