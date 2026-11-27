import { useCallback, useEffect, useMemo, useState } from "react";
import KanbanCard from "../components/KanbanCard";
import Botao from "../components/Botao";
import CabecalhoPagina from "../components/CabecalhoPagina";
import InputField from "../components/InputField";
import LinkBotao from "../components/LinkBotao";
import SelectField from "../components/SelectField";
import { Carregando, ErroCarregar } from "../components/Estados";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import ticketService from "../services/ticketService";
import prioridadeService from "../services/prioridadeService";
import categoriaService from "../services/categoriaService";
import departamentoService from "../services/departamentoService";
import { temPermissao } from "../utils/permissoes";
import { STATUS_LABEL } from "../constants/labels";
import { CORES_STATUS } from "../constants/cores";
import { opcoesSetor } from "../utils/setor";
import { COLUNAS_KANBAN, acaoAoMover, agruparPorStatus, filtrarTickets, moverTicket } from "../utils/kanban";

const FILTROS_VAZIOS = { busca: "", prioridadeId: "", categoriaId: "", departamentoId: "", apenasMeus: false, apenasAtrasados: false };

export default function Kanban() {
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const podeGerenciar = temPermissao(usuario, "tickets.tratar");

  const [tickets, setTickets] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  const [arrastandoId, setArrastandoId] = useState(null);
  const [colunaSobre, setColunaSobre] = useState(null);

  const carregar = useCallback(async () => {
    try {
      // Mais antigos primeiro: dentro de cada coluna, quem espera há mais tempo
      // fica no topo (agruparPorStatus preserva a ordem que veio da API).
      setTickets(await ticketService.listar({ ordem: "antigos" }));
      setFalhou(false);
    } catch {
      setFalhou(true);
      notificar("Erro ao carregar os chamados", "erro");
    } finally {
      setCarregando(false);
    }
  }, [notificar]);

  useEffect(() => {
    Promise.resolve().then(carregar);
    prioridadeService.listar().then(setPrioridades).catch(() => {});
    categoriaService.listar().then(setCategorias).catch(() => {});
    departamentoService.listar().then(setDepartamentos).catch(() => {});
  }, [carregar]);

  const colunas = useMemo(
    () => agruparPorStatus(filtrarTickets(tickets, { ...filtros, usuarioId: usuario.id })),
    [tickets, filtros, usuario.id]
  );

  async function mover(ticket, destino) {
    if (!podeGerenciar || ticket.status === destino) return;

    const acao = acaoAoMover(ticket, destino, usuario);
    if (acao === "exigeMotivo") {
      notificar(`Para suspender o chamado #${ticket.id}, abra o chamado e informe o motivo`, "erro");
      return;
    }

    // Atualização otimista: o cartão muda de coluna na hora; se a API recusar,
    // recarrega para voltar ao estado real.
    setTickets((atual) => moverTicket(atual, ticket.id, destino));
    try {
      if (acao === "retomar") {
        await ticketService.retomar(ticket.id);
        notificar(`Chamado #${ticket.id} retomado`);
      } else if (acao === "assumir") {
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
      <CabecalhoPagina
        titulo="Kanban"
        descricao={
          podeGerenciar
            ? "Arraste os cartões entre as colunas (ou use o seletor do cartão) para mudar o status."
            : "Acompanhe o andamento dos seus chamados."
        }
      >
        <LinkBotao to="/tickets/novo">Novo chamado</LinkBotao>
      </CabecalhoPagina>

      <div role="search" aria-label="Filtros do quadro" className="mb-4 grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex sm:flex-wrap">
        <div className="sm:w-56">
          <InputField
            label="Buscar"
            placeholder="Título, descrição ou #número"
            value={filtros.busca}
            onChange={(e) => alterarFiltro("busca", e.target.value)}
          />
        </div>
        <div className="sm:w-40">
          <SelectField
            label="Prioridade"
            placeholder="Todas"
            value={filtros.prioridadeId}
            onChange={(e) => alterarFiltro("prioridadeId", e.target.value)}
            options={prioridades.map((p) => ({ value: p.id, label: p.nome }))}
          />
        </div>
        <div className="sm:w-40">
          <SelectField
            label="Categoria"
            placeholder="Todas"
            value={filtros.categoriaId}
            onChange={(e) => alterarFiltro("categoriaId", e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
        </div>
        <div className="sm:w-40">
          <SelectField
            label="Setor"
            placeholder="Todos"
            value={filtros.departamentoId}
            onChange={(e) => alterarFiltro("departamentoId", e.target.value)}
            options={opcoesSetor(departamentos)}
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
          <Botao type="button" variante="link" className="justify-self-start pb-2" onClick={() => setFiltros(FILTROS_VAZIOS)}>
            Limpar filtros
          </Botao>
        )}
      </div>

      {carregando ? (
        <Carregando />
      ) : falhou ? (
        <ErroCarregar texto="Não foi possível carregar os chamados." onTentarDeNovo={carregar} />
      ) : (
        // Até o desktop largo as colunas ficam lado a lado e o quadro rola na
        // horizontal (com encaixe em cada coluna no celular); no xl cabem as 5.
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-5 xl:overflow-visible">
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
              className={`flex min-h-64 w-[85vw] max-w-xs shrink-0 snap-start flex-col rounded-lg border bg-gray-50 p-3 transition-colors sm:w-72 xl:w-auto xl:max-w-none ${
                colunaSobre === status ? "border-blue-400 bg-blue-50" : "border-gray-200"
              }`}
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES_STATUS[status] }} aria-hidden="true" />
                  {STATUS_LABEL[status]}
                </h2>
                <span
                  className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                  aria-label={`${colunas[status].length} ${colunas[status].length === 1 ? "chamado" : "chamados"}`}
                >
                  {colunas[status].length}
                </span>
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
                  <p className="rounded-md border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">Nenhum chamado</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
