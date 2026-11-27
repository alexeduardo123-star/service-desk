import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AgendamentoForm from "../components/AgendamentoForm";
import Botao from "../components/Botao";
import SelectField from "../components/SelectField";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import agendaService from "../services/agendaService";
import usuarioService from "../services/usuarioService";
import { temPermissao } from "../utils/permissoes";
import {
  DIAS_SEMANA,
  NOMES_MESES,
  agruparPorDia,
  chaveDoDia,
  diasDoMes,
  horaDoDia,
  mesDeHoje,
  periodoDaGrade,
  podeAlterarAgendamento,
  somarMeses,
  tituloDoDia,
} from "../utils/agenda";

const MAX_NA_CELULA = 3;

function Chip({ item }) {
  if (item.tipo === "prazo") {
    const cor = item.vencido ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    return (
      <span className={`block truncate rounded px-1.5 py-0.5 text-xs ${cor}`} title={`Prazo de SLA do chamado #${item.ticketId}: ${item.titulo}`}>
        SLA #{item.ticketId}
      </span>
    );
  }
  return (
    <span className="block truncate rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800" title={item.titulo}>
      {horaDoDia(item.inicio)} {item.titulo}
    </span>
  );
}

export default function Agenda() {
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const podeGerenciar = temPermissao(usuario, "agenda.gerenciar");
  const gerenciaTodos = temPermissao(usuario, "agenda.todos");

  const [mes, setMes] = useState(() => mesDeHoje());
  const [atendenteId, setAtendenteId] = useState("");
  const [atendentes, setAtendentes] = useState([]);
  const [dados, setDados] = useState({ prazos: [], agendamentos: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState(() => chaveDoDia(new Date()));
  const [formulario, setFormulario] = useState(null); // null | { agendamento? }
  const [salvando, setSalvando] = useState(false);

  const dias = useMemo(() => diasDoMes(mes), [mes]);
  const porDia = useMemo(() => agruparPorDia(dados.prazos, dados.agendamentos), [dados]);

  // Lista de atendentes para o filtro e para agendar em nome de outros.
  useEffect(() => {
    usuarioService.atendentes().then(setAtendentes).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const periodo = periodoDaGrade(dias);
      setDados(await agendaService.listar({ ...periodo, atendenteId: atendenteId || undefined }));
      setErro("");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível carregar a agenda. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [dias, atendenteId]);

  useEffect(() => {
    Promise.resolve().then(carregar);
  }, [carregar]);

  const hoje = chaveDoDia(new Date());
  const doDia = porDia[diaSelecionado] ?? { prazos: [], agendamentos: [] };

  function mudarMes(delta) {
    const novo = somarMeses(mes, delta);
    setMes(novo);
    setFormulario(null);
    // Mantém a seleção dentro do mês exibido: hoje, se for este mês, ou o dia 1.
    const mesDeHojeAtual = mesDeHoje();
    const eHoje = novo.ano === mesDeHojeAtual.ano && novo.mes === mesDeHojeAtual.mes;
    setDiaSelecionado(eHoje ? hoje : `${novo.ano}-${String(novo.mes).padStart(2, "0")}-01`);
  }

  function irParaHoje() {
    setMes(mesDeHoje());
    setDiaSelecionado(hoje);
  }

  async function salvar(corpo) {
    setSalvando(true);
    try {
      if (formulario.agendamento) {
        await agendaService.atualizar(formulario.agendamento.id, corpo);
        notificar("Atendimento atualizado");
      } else {
        await agendaService.criar(corpo);
        notificar("Atendimento agendado");
      }
      setFormulario(null);
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar o atendimento", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(agendamento) {
    if (!confirm(`Cancelar o atendimento "${agendamento.titulo}"?`)) return;
    try {
      await agendaService.excluir(agendamento.id);
      notificar("Atendimento cancelado");
      await carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao cancelar o atendimento", "erro");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>

        <div className="flex flex-wrap items-end gap-2">
          {atendentes.length > 0 && (
            <SelectField
              label="Atendente"
              value={atendenteId}
              onChange={(e) => setAtendenteId(e.target.value)}
              placeholder="Todos"
              options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
            />
          )}
          <Botao variante="secundario" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</Botao>
          <Botao variante="secundario" onClick={irParaHoje}>Hoje</Botao>
          <Botao variante="secundario" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</Botao>
        </div>
      </div>

      <p className="mb-3 text-lg font-medium capitalize text-gray-800" aria-live="polite">
        {NOMES_MESES[mes.mes - 1]} de {mes.ano}
      </p>

      {erro && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-600" aria-label="Legenda">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-300" /> Atendimento agendado</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-300" /> Prazo de SLA</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-300" /> SLA vencido</span>
        {carregando && <span>Carregando…</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium uppercase text-gray-500">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const itens = [
                ...(porDia[dia.chave]?.agendamentos ?? []).map((a) => ({ ...a, tipo: "atendimento" })),
                ...(porDia[dia.chave]?.prazos ?? []).map((p) => ({ ...p, tipo: "prazo" })),
              ];
              const selecionado = dia.chave === diaSelecionado;
              return (
                <button
                  key={dia.chave}
                  type="button"
                  aria-label={`${tituloDoDia(dia.chave)}${itens.length ? `, ${itens.length} item(ns)` : ""}`}
                  aria-pressed={selecionado}
                  onClick={() => {
                    setDiaSelecionado(dia.chave);
                    setFormulario(null);
                  }}
                  className={`flex min-h-24 flex-col gap-1 border-b border-r border-gray-100 p-1.5 text-left align-top hover:bg-blue-50 ${
                    dia.doMes ? "bg-white" : "bg-gray-50 text-gray-400"
                  } ${selecionado ? "ring-2 ring-inset ring-blue-500" : ""}`}
                >
                  <span className={`text-xs font-medium ${dia.chave === hoje ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white" : ""}`}>
                    {dia.dia}
                  </span>
                  {itens.slice(0, MAX_NA_CELULA).map((item) => (
                    <Chip key={`${item.tipo}-${item.id ?? item.ticketId}`} item={item} />
                  ))}
                  {itens.length > MAX_NA_CELULA && (
                    <span className="text-xs text-gray-500">+{itens.length - MAX_NA_CELULA} mais</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-3" aria-label="Detalhes do dia">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold capitalize text-gray-900">{tituloDoDia(diaSelecionado)}</h2>
            {podeGerenciar && !formulario && (
              <Botao onClick={() => setFormulario({})}>Agendar</Botao>
            )}
          </div>

          {formulario && (
            <AgendamentoForm
              key={formulario.agendamento?.id ?? "novo"}
              inicial={formulario.agendamento}
              dia={diaSelecionado}
              atendentes={atendentes}
              podeEscolherAtendente={gerenciaTodos}
              atendenteInicial={atendenteId || usuario?.id}
              salvando={salvando}
              onSalvar={salvar}
              onCancelar={() => setFormulario(null)}
            />
          )}

          {doDia.agendamentos.length === 0 && doDia.prazos.length === 0 && !formulario && (
            <p className="text-sm text-gray-500">Nada neste dia.</p>
          )}

          {doDia.agendamentos.length > 0 && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Atendimentos</h3>
              <ul className="flex flex-col gap-2">
                {doDia.agendamentos.map((a) => (
                  <li key={a.id} className="rounded-md border border-blue-100 bg-blue-50 p-2 text-sm">
                    <p className="font-medium text-gray-900">{a.titulo}</p>
                    <p className="text-xs text-gray-600">
                      {horaDoDia(a.inicio)}–{horaDoDia(a.fim)} · {a.atendente?.nome}
                    </p>
                    {a.ticket && (
                      <Link to={`/tickets/${a.ticket.id}`} className="text-xs text-blue-700 hover:underline">
                        Chamado #{a.ticket.id}: {a.ticket.titulo}
                      </Link>
                    )}
                    {a.descricao && <p className="mt-1 text-xs text-gray-700">{a.descricao}</p>}
                    {podeAlterarAgendamento(usuario, a, { gerenciar: podeGerenciar, todos: gerenciaTodos }) && (
                      <div className="mt-1 flex gap-3 text-xs">
                        <button type="button" className="text-blue-600 hover:underline" onClick={() => setFormulario({ agendamento: a })}>
                          Editar
                        </button>
                        <button type="button" className="text-red-600 hover:underline" onClick={() => cancelar(a)}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doDia.prazos.length > 0 && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Prazos de SLA</h3>
              <ul className="flex flex-col gap-2">
                {doDia.prazos.map((p) => (
                  <li key={p.ticketId} className={`rounded-md border p-2 text-sm ${p.vencido ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50"}`}>
                    <Link to={`/tickets/${p.ticketId}`} className="font-medium text-gray-900 hover:underline">
                      #{p.ticketId} {p.titulo}
                    </Link>
                    <p className="text-xs text-gray-600">
                      {p.vencido ? "Venceu" : "Vence"} às {horaDoDia(p.prazo)}
                      {p.prioridade ? ` · ${p.prioridade.nome}` : ""}
                      {p.tecnico ? ` · ${p.tecnico.nome}` : " · sem atendente"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
