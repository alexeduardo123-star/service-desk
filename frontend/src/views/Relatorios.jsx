import { useCallback, useEffect, useRef, useState } from "react";
import Botao from "../components/Botao";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Paginacao from "../components/Paginacao";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/charts/StatCard";
import ChartCard from "../components/charts/ChartCard";
import DonutChart from "../components/charts/DonutChart";
import BarChart from "../components/charts/BarChart";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import relatorioService from "../services/relatorioService";
import categoriaService from "../services/categoriaService";
import prioridadeService from "../services/prioridadeService";
import usuarioService from "../services/usuarioService";
import { PapelUsuario } from "../enum/PapelUsuario";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";
import { CORES_STATUS } from "../constants/cores";
import { formatDate } from "../utils/formatDate";
import { formatarHoras } from "../utils/charts";
import { paginar } from "../utils/paginar";
import { gerarCsv, baixarCsv } from "../utils/csv";
import { FILTROS_RELATORIO_VAZIOS, dataDiasAtras, filtrosDoSalvo, limparFiltros, resumirFiltros } from "../utils/relatorioFiltros";

const LINHAS_POR_PAGINA = 10;

const SLA_LABEL = { NO_PRAZO: "No prazo", ATRASADO: "Atrasado", VENCIDO: "Vencido" };
const SLA_COR = {
  NO_PRAZO: "bg-emerald-100 text-emerald-800",
  ATRASADO: "bg-amber-100 text-amber-800",
  VENCIDO: "bg-red-100 text-red-800",
};

const COLUNAS_CSV = [
  { rotulo: "#", valor: (l) => l.id },
  { rotulo: "Título", valor: (l) => l.titulo },
  { rotulo: "Status", valor: (l) => STATUS_LABEL[l.status] ?? l.status },
  { rotulo: "Categoria", valor: (l) => l.categoria },
  { rotulo: "Prioridade", valor: (l) => l.prioridade },
  { rotulo: "Solicitante", valor: (l) => l.solicitante },
  { rotulo: "Técnico", valor: (l) => l.tecnico },
  { rotulo: "Aberto em", valor: (l) => formatDate(l.criadoEm) },
  { rotulo: "Fechado em", valor: (l) => (l.fechadoEm ? formatDate(l.fechadoEm) : "") },
  { rotulo: "Horas até resolver", valor: (l) => (l.horasResolucao == null ? "" : String(l.horasResolucao).replace(".", ",")) },
  { rotulo: "SLA", valor: (l) => SLA_LABEL[l.slaStatus] ?? "" },
];

const filtrosIniciais = () => ({ ...FILTROS_RELATORIO_VAZIOS, de: dataDiasAtras(30) });

export default function Relatorios() {
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const isAdmin = usuario?.papel === PapelUsuario.ADMIN;

  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);

  const [categorias, setCategorias] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [salvos, setSalvos] = useState([]);
  const [formSalvar, setFormSalvar] = useState(null); // { nome, descricao } | null
  const [edicao, setEdicao] = useState(null); // { id, nome, descricao, substituirFiltros } | null
  const [salvando, setSalvando] = useState(false);

  // Só a resposta da última geração vale (evita resultado antigo sobrescrever o novo).
  const ultimaRequisicao = useRef(0);

  const gerar = useCallback(async (filtrosUsados) => {
    const numero = ++ultimaRequisicao.current;
    setCarregando(true);
    setErro("");
    try {
      const dados = await relatorioService.gerarChamados(filtrosUsados);
      if (numero !== ultimaRequisicao.current) return;
      setRelatorio(dados);
      setPagina(1);
    } catch (err) {
      if (numero !== ultimaRequisicao.current) return;
      setErro(err.response?.data?.erro || "Não foi possível gerar o relatório.");
    } finally {
      if (numero === ultimaRequisicao.current) setCarregando(false);
    }
  }, []);

  const carregarSalvos = useCallback(async () => {
    try {
      setSalvos(await relatorioService.listarSalvos());
    } catch {
      notificar("Erro ao carregar os relatórios salvos", "erro");
    }
  }, [notificar]);

  // Carga inicial: listas dos filtros, relatórios salvos e o primeiro relatório
  // (últimos 30 dias). Agendada como microtask para não chamar setState de
  // forma síncrona dentro do efeito (react-hooks/set-state-in-effect).
  useEffect(() => {
    Promise.resolve().then(() => {
      gerar(filtrosIniciais());
      carregarSalvos();
    });
    categoriaService.listar().then(setCategorias).catch(() => {});
    prioridadeService.listar().then(setPrioridades).catch(() => {});
    if (isAdmin) {
      usuarioService
        .listar()
        .then((lista) => setTecnicos(lista.filter((u) => u.papel === PapelUsuario.TECNICO)))
        .catch(() => {});
    }
  }, [gerar, carregarSalvos, isAdmin]);

  function alterarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleGerar(e) {
    e.preventDefault();
    gerar(filtros);
  }

  function limpar() {
    setFiltros({ ...FILTROS_RELATORIO_VAZIOS });
    gerar(FILTROS_RELATORIO_VAZIOS);
  }

  function aplicarSalvo(salvo) {
    const novos = filtrosDoSalvo(salvo.filtros);
    setFiltros(novos);
    gerar(novos);
  }

  async function salvarNovo(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await relatorioService.criarSalvo({
        nome: formSalvar.nome,
        descricao: formSalvar.descricao.trim() || null,
        filtros: limparFiltros(filtros),
      });
      notificar("Filtros salvos");
      setFormSalvar(null);
      await carregarSalvos();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar os filtros", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const dados = { nome: edicao.nome, descricao: edicao.descricao.trim() || null };
      if (edicao.substituirFiltros) dados.filtros = limparFiltros(filtros);
      await relatorioService.atualizarSalvo(edicao.id, dados);
      notificar("Relatório salvo atualizado");
      setEdicao(null);
      await carregarSalvos();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao atualizar o relatório salvo", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirSalvo(salvo) {
    if (!confirm(`Excluir o relatório salvo "${salvo.nome}"?`)) return;
    try {
      await relatorioService.excluirSalvo(salvo.id);
      notificar("Relatório salvo excluído");
      if (edicao?.id === salvo.id) setEdicao(null);
      await carregarSalvos();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao excluir o relatório salvo", "erro");
    }
  }

  function exportarCsv() {
    if (!relatorio) return;
    const data = relatorio.geradoEm.slice(0, 10);
    baixarCsv(`relatorio-chamados-${data}.csv`, gerarCsv(COLUNAS_CSV, relatorio.linhas));
  }

  const opcoesTecnico = [
    { value: "me", label: "Meus chamados" },
    { value: "none", label: "Sem técnico" },
    ...tecnicos.map((t) => ({ value: t.id, label: t.nome })),
  ];

  const resumo = relatorio?.resumo;
  const todasLinhas = relatorio?.linhas ?? [];
  const { pagina: paginaAtual, totalPaginas, total } = paginar(todasLinhas, pagina, LINHAS_POR_PAGINA);
  const inicioPagina = (paginaAtual - 1) * LINHAS_POR_PAGINA;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">Chamados por período, com indicadores de SLA e exportação.</p>
        </div>
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={exportarCsv} disabled={!relatorio || relatorio.total === 0}>
            Exportar CSV
          </Botao>
          <Botao variante="secundario" onClick={() => window.print()} disabled={!relatorio}>
            Imprimir
          </Botao>
        </div>
      </div>

      {/* Cabeçalho que só aparece na impressão */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold text-gray-900">Relatório de chamados</h1>
        {relatorio && (
          <p className="text-sm text-gray-600">
            Gerado em {formatDate(relatorio.geradoEm)} por {relatorio.geradoPor}
          </p>
        )}
      </div>

      <form onSubmit={handleGerar} className="rounded-lg border border-gray-200 bg-white p-4 print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InputField label="De" type="date" value={filtros.de} onChange={(e) => alterarFiltro("de", e.target.value)} />
          <InputField label="Até" type="date" value={filtros.ate} onChange={(e) => alterarFiltro("ate", e.target.value)} />
          <SelectField
            label="Status"
            placeholder="Todos"
            value={filtros.status}
            onChange={(e) => alterarFiltro("status", e.target.value)}
            options={Object.values(StatusTicket).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <SelectField
            label="Categoria"
            placeholder="Todas"
            value={filtros.categoriaId}
            onChange={(e) => alterarFiltro("categoriaId", e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
          <SelectField
            label="Prioridade"
            placeholder="Todas"
            value={filtros.prioridadeId}
            onChange={(e) => alterarFiltro("prioridadeId", e.target.value)}
            options={prioridades.map((p) => ({ value: p.id, label: p.nome }))}
          />
          <SelectField
            label="Técnico"
            placeholder="Todos"
            value={filtros.tecnicoId}
            onChange={(e) => alterarFiltro("tecnicoId", e.target.value)}
            options={opcoesTecnico}
          />
          <div className="sm:col-span-2">
            <InputField
              label="Busca"
              placeholder="Título ou descrição"
              value={filtros.q}
              onChange={(e) => alterarFiltro("q", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Botao type="submit" disabled={carregando}>
            {carregando ? "Gerando…" : "Gerar relatório"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={limpar}>
            Limpar filtros
          </Botao>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => setFormSalvar(formSalvar ? null : { nome: "", descricao: "" })}
            disabled={resumirFiltros(filtros) === 0}
          >
            Salvar estes filtros
          </Botao>
        </div>

      </form>

      {formSalvar && (
        <form onSubmit={salvarNovo} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 print:hidden">
          <InputField
            label="Nome do relatório"
            value={formSalvar.nome}
            onChange={(e) => setFormSalvar({ ...formSalvar, nome: e.target.value })}
            placeholder="Ex.: Chamados vencidos do mês"
            maxLength={80}
          />
          <InputField
            label="Descrição (opcional)"
            value={formSalvar.descricao}
            onChange={(e) => setFormSalvar({ ...formSalvar, descricao: e.target.value })}
            maxLength={255}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Botao type="submit" disabled={salvando || formSalvar.nome.trim().length < 3}>
              {salvando ? "Salvando…" : "Salvar"}
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => setFormSalvar(null)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4 print:hidden">
        <h2 className="text-sm font-semibold text-gray-900">Relatórios salvos</h2>
        <p className="mb-3 text-xs text-gray-500">Filtros que você guardou para gerar o mesmo relatório de novo com um clique.</p>

        {salvos.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum relatório salvo ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {salvos.map((salvo) => (
              <li key={salvo.id} className="py-3">
                {edicao?.id === salvo.id ? (
                  <form onSubmit={salvarEdicao} className="grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Nome"
                      value={edicao.nome}
                      onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
                      maxLength={80}
                    />
                    <InputField
                      label="Descrição"
                      value={edicao.descricao}
                      onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })}
                      maxLength={255}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={edicao.substituirFiltros}
                        onChange={(e) => setEdicao({ ...edicao, substituirFiltros: e.target.checked })}
                      />
                      Substituir pelos filtros atuais da tela
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <Botao type="submit" disabled={salvando || edicao.nome.trim().length < 3}>
                        {salvando ? "Salvando…" : "Salvar alterações"}
                      </Botao>
                      <Botao type="button" variante="secundario" onClick={() => setEdicao(null)}>
                        Cancelar
                      </Botao>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{salvo.nome}</p>
                      <p className="text-xs text-gray-500">
                        {salvo.descricao ? `${salvo.descricao} · ` : ""}
                        {resumirFiltros(filtrosDoSalvo(salvo.filtros))} filtro(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Botao variante="secundario" onClick={() => aplicarSalvo(salvo)}>
                        Aplicar
                      </Botao>
                      <Botao
                        variante="secundario"
                        onClick={() =>
                          setEdicao({ id: salvo.id, nome: salvo.nome, descricao: salvo.descricao ?? "", substituirFiltros: false })
                        }
                      >
                        Editar
                      </Botao>
                      <Botao variante="perigo" onClick={() => excluirSalvo(salvo)}>
                        Excluir
                      </Botao>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {erro && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden">
          {erro}
        </p>
      )}

      {carregando && !relatorio && <p className="text-sm text-gray-500">Gerando relatório…</p>}

      {relatorio && resumo && (
        <>
          {relatorio.truncado && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              O resultado foi limitado aos {relatorio.total} chamados mais recentes. Refine os filtros para ver o restante.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard titulo="Chamados no relatório" valor={relatorio.total} />
            <StatCard titulo="Tempo médio de resolução" valor={formatarHoras(resumo.tempoMedioResolucaoHoras)} detalhe="só chamados fechados" />
            <StatCard
              titulo="SLA cumprido"
              valor={resumo.slaCumpridoPercentual == null ? "-" : `${resumo.slaCumpridoPercentual}%`}
              detalhe="dos chamados fechados"
              cor="#10b981"
            />
            <StatCard
              titulo="SLA vencido"
              valor={resumo.totais.slaVencidos}
              detalhe="em aberto fora do prazo"
              cor="#ef4444"
              destaque={resumo.totais.slaVencidos > 0}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard titulo="Por status">
              <DonutChart
                rotuloTotal="chamados"
                itens={resumo.porStatus.map((s) => ({ rotulo: STATUS_LABEL[s.status], valor: s.total, cor: CORES_STATUS[s.status] }))}
                vazio="Nenhum chamado no período."
              />
            </ChartCard>
            <ChartCard titulo="Por categoria">
              <BarChart itens={resumo.porCategoria.map((c) => ({ rotulo: c.nome, valor: c.total }))} vazio="Nenhum chamado no período." />
            </ChartCard>
            <ChartCard titulo="Por técnico" subtitulo="os 5 com mais chamados">
              <BarChart itens={(resumo.topTecnicos ?? []).map((t) => ({ rotulo: t.nome, valor: t.total }))} vazio="Nenhum técnico atribuído." />
            </ChartCard>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Chamados ({relatorio.total})</h2>
            {relatorio.total === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Nenhum chamado encontrado com esses filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Título</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3">Prioridade</th>
                      <th className="py-2 pr-3">Solicitante</th>
                      <th className="py-2 pr-3">Técnico</th>
                      <th className="py-2 pr-3">Aberto em</th>
                      <th className="py-2 pr-3">Resolução</th>
                      <th className="py-2">SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Na tela só a página atual; ao imprimir saem todas as linhas. */}
                    {todasLinhas.map((l, i) => (
                      <tr key={l.id} className={i >= inicioPagina && i < inicioPagina + LINHAS_POR_PAGINA ? "" : "hidden print:table-row"}>
                        <td className="py-2 pr-3 text-gray-500">{l.id}</td>
                        <td className="max-w-64 truncate py-2 pr-3 font-medium text-gray-900" title={l.titulo}>
                          {l.titulo}
                        </td>
                        <td className="py-2 pr-3">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="py-2 pr-3">{l.categoria ?? "-"}</td>
                        <td className="py-2 pr-3">{l.prioridade ?? "-"}</td>
                        <td className="py-2 pr-3">{l.solicitante ?? "-"}</td>
                        <td className="py-2 pr-3">{l.tecnico ?? "-"}</td>
                        <td className="whitespace-nowrap py-2 pr-3">{formatDate(l.criadoEm)}</td>
                        <td className="whitespace-nowrap py-2 pr-3">{formatarHoras(l.horasResolucao)}</td>
                        <td className="py-2">
                          {l.slaStatus ? (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SLA_COR[l.slaStatus]}`}>
                              {SLA_LABEL[l.slaStatus]}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="print:hidden">
              <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} total={total} onChange={setPagina} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
