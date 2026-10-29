import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import KanbanCard from "../components/KanbanCard";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import ticketService from "../services/ticketService";
import prioridadeService from "../services/prioridadeService";
import categoriaService from "../services/categoriaService";
import { PapelUsuario } from "../enum/PapelUsuario";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";
import { CORES_STATUS } from "../constants/cores";
import { COLUNAS_KANBAN, agruparPorStatus, filtrarTickets, moverTicket } from "../utils/kanban";

const FILTROS_VAZIOS = { busca: "", prioridadeId: "", categoriaId: "", apenasMeus: false, apenasAtrasados: false };

export default function Kanban() {
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const podeGerenciar = usuario.papel === PapelUsuario.ADMIN || usuario.papel === PapelUsuario.TECNICO;

  const [tickets, setTickets] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [arrastandoId, setArrastandoId] = useState(null);
  const [colunaSobre, setColunaSobre] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setTickets(await ticketService.listar());
    } catch {
      notificar("Erro ao carregar os chamados", "erro");
    } finally {
      setCarregando(false);
    }
  }, [notificar]);

  useEffect(() => {
    Promise.resolve().then(carregar);
    prioridadeService.listar().then(setPrioridades).catch(() => {});
    categoriaService.listar().then(setCategorias).catch(() => {});
  }, [carregar]);

  const colunas = useMemo(
    () => agruparPorStatus(filtrarTickets(tickets, { ...filtros, usuarioId: usuario.id })),
    [tickets, filtros, usuario.id]
  );

  async function mover(ticket, destino) {
    if (!podeGerenciar || ticket.status === destino) return;

    const vaiAssumir = usuario.papel === PapelUsuario.TECNICO && destino === StatusTicket.EM_ANDAMENTO && !ticket.tecnico;

    // Atualização otimista: o cartão muda de coluna na hora; se a API recusar,
    // recarrega para voltar ao estado real.
    setTickets((atual) => moverTicket(atual, ticket.id, destino));
    try {
      if (vaiAssumir) {
        // Técnico que puxa um chamado sem responsável para "Em andamento" o assume.
        await ticketService.atribuir(ticket.id, usuario.id);
        notificar(`Chamado #${ticket.id} atribuído a você`);
      } else {
        await ticketService.alterarStatus(ticket.id, destino);
        notificar(`Chamado #${ticket.id} movido para ${STATUS_LABEL[destino]}`);
      }
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível mover o chamado", "erro");
      carregar();
    }
  }

  function soltar(e, destino) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain")) || arrastandoId;
    const ticket = tickets.find((t) => t.id === id);
    setColunaSobre(null);
    setArrastandoId(null);
    if (ticket) mover(ticket, destino);
  }

  const alterarFiltro = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kanban</h1>
          <p className="text-sm text-gray-500">
            {podeGerenciar ? "Arraste os cartões entre as colunas para mudar o status." : "Acompanhe o andamento dos seus chamados."}
          </p>
        </div>
        <Link to="/tickets/novo" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Novo chamado
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-56">
          <InputField
            label="Buscar"
            placeholder="Título, descrição ou #número"
            value={filtros.busca}
            onChange={(e) => alterarFiltro("busca", e.target.value)}
          />
        </div>
        <div className="w-40">
          <SelectField
            label="Prioridade"
            placeholder="Todas"
            value={filtros.prioridadeId}
            onChange={(e) => alterarFiltro("prioridadeId", e.target.value)}
            options={prioridades.map((p) => ({ value: p.id, label: p.nome }))}
          />
        </div>
        <div className="w-40">
          <SelectField
            label="Categoria"
            placeholder="Todas"
            value={filtros.categoriaId}
            onChange={(e) => alterarFiltro("categoriaId", e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
        </div>
        {podeGerenciar && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={filtros.apenasMeus} onChange={(e) => alterarFiltro("apenasMeus", e.target.checked)} />
            Somente meus
          </label>
        )}
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
          <input type="checkbox" checked={filtros.apenasAtrasados} onChange={(e) => alterarFiltro("apenasAtrasados", e.target.checked)} />
          SLA vencido
        </label>
        {filtrosAtivos && (
          <button onClick={() => setFiltros(FILTROS_VAZIOS)} className="pb-2 text-sm text-blue-600 hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUNAS_KANBAN.map((status) => (
            <section
              key={status}
              aria-label={`Coluna ${STATUS_LABEL[status]}`}
              onDragOver={(e) => {
                if (!podeGerenciar) return;
                e.preventDefault();
                setColunaSobre(status);
              }}
              onDragLeave={() => setColunaSobre((atual) => (atual === status ? null : atual))}
              onDrop={(e) => podeGerenciar && soltar(e, status)}
              className={`flex min-h-64 flex-col rounded-lg border bg-gray-50 p-3 transition-colors ${
                colunaSobre === status ? "border-blue-400 bg-blue-50" : "border-gray-200"
              }`}
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES_STATUS[status] }} aria-hidden="true" />
                  {STATUS_LABEL[status]}
                </h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">{colunas[status].length}</span>
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {colunas[status].map((ticket) => (
                  <KanbanCard
                    key={ticket.id}
                    ticket={ticket}
                    podeMover={podeGerenciar}
                    arrastando={arrastandoId === ticket.id}
                    onDragStart={setArrastandoId}
                    onDragEnd={() => {
                      setArrastandoId(null);
                      setColunaSobre(null);
                    }}
                    onMover={mover}
                  />
                ))}
                {colunas[status].length === 0 && (
                  <p className="rounded-md border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">Nenhum chamado</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
