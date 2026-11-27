import { useEffect, useState } from "react";
import ticketService from "../services/ticketService";
import departamentoService from "../services/departamentoService";
import TicketCard from "../components/TicketCard";
import CabecalhoPagina from "../components/CabecalhoPagina";
import LinkBotao from "../components/LinkBotao";
import { Carregando, ErroCarregar, Vazio } from "../components/Estados";
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
  const [falhou, setFalhou] = useState(false);
  // Incrementado pelo "Tentar de novo" para refazer a busca.
  const [tentativa, setTentativa] = useState(0);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    // Agendada como microtask para não disparar setState de forma síncrona
    // dentro do corpo do efeito (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => setCarregando(true));
    ticketService
      .listar({ ordem, ...(statusFiltro ? { status: statusFiltro } : {}), ...(setorFiltro ? { departamentoId: setorFiltro } : {}) })
      .then((lista) => {
        setTickets(lista);
        setFalhou(false);
      })
      .catch(() => setFalhou(true))
      .finally(() => setCarregando(false));
  }, [statusFiltro, setorFiltro, ordem, tentativa]);

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
      <CabecalhoPagina titulo="Chamados">
        <LinkBotao to="/tickets/novo">Novo chamado</LinkBotao>
      </CabecalhoPagina>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={statusFiltro === ""}
            onClick={() => mudarFiltro("")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === "" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Todos
          </button>
          {Object.values(StatusTicket).map((status) => (
            <button
              type="button"
              key={status}
              aria-pressed={statusFiltro === status}
              onClick={() => mudarFiltro(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusFiltro === status ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
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
        <Carregando />
      ) : falhou ? (
        <ErroCarregar texto="Não foi possível carregar os chamados." onTentarDeNovo={() => setTentativa((t) => t + 1)} />
      ) : tickets.length === 0 ? (
        <Vazio texto="Nenhum chamado encontrado." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {!carregando && !falhou && <Paginacao {...paginacao} onChange={setPagina} />}
    </div>
  );
}
