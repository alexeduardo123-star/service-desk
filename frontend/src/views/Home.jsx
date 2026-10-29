import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";
import dashboardService from "../services/dashboardService";
import TicketCard from "../components/TicketCard";
import StatCard from "../components/charts/StatCard";
import ChartCard from "../components/charts/ChartCard";
import LineChart from "../components/charts/LineChart";
import DonutChart from "../components/charts/DonutChart";
import BarChart from "../components/charts/BarChart";
import { STATUS_LABEL } from "../constants/labels";
import { COR_POR_NIVEL, CORES_STATUS } from "../constants/cores";
import { StatusTicket } from "../enum/StatusTicket";
import { diaCurto, formatarHoras } from "../utils/charts";

const PERIODOS = [7, 14, 30];

export default function Home() {
  const [dias, setDias] = useState(14);
  const [resumo, setResumo] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => ativo && setCarregando(true));
    Promise.all([dashboardService.obter(dias), ticketService.listar()])
      .then(([dados, lista]) => {
        if (!ativo) return;
        setResumo(dados);
        setTickets(lista);
        setErro(false);
      })
      .catch(() => ativo && setErro(true))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [dias]);

  const totais = resumo?.totais;
  const valor = (n) => (carregando && !resumo ? "…" : n);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-full bg-gray-200 p-0.5" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setDias(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${dias === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
              >
                {p} dias
              </button>
            ))}
          </div>
          <Link to="/tickets/novo" className="text-sm font-medium text-blue-600 hover:underline">
            Abrir novo chamado
          </Link>
        </div>
      </div>

      {erro && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Não foi possível carregar as métricas.</p>}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard titulo="Total" valor={valor(totais?.total)} cor="#64748b" />
        <StatCard titulo={STATUS_LABEL[StatusTicket.ABERTO]} valor={valor(totais?.abertos)} cor={CORES_STATUS.ABERTO} />
        <StatCard titulo={STATUS_LABEL[StatusTicket.EM_ANDAMENTO]} valor={valor(totais?.emAndamento)} cor={CORES_STATUS.EM_ANDAMENTO} />
        <StatCard titulo={STATUS_LABEL[StatusTicket.FECHADO]} valor={valor(totais?.fechados)} cor={CORES_STATUS.FECHADO} />
        <StatCard
          titulo="SLA vencido"
          valor={valor(totais?.slaVencidos)}
          detalhe="chamados em atraso"
          cor="#ef4444"
          destaque={totais?.slaVencidos > 0}
        />
        <StatCard titulo="Sem técnico" valor={valor(totais?.semTecnico)} detalhe="aguardando atribuição" cor="#8b5cf6" />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          titulo="Tempo médio de resolução"
          valor={resumo ? formatarHoras(resumo.tempoMedioResolucaoHoras) : "…"}
          detalhe="considerando chamados fechados"
          cor="#06b6d4"
        />
        <StatCard
          titulo="SLA cumprido"
          valor={resumo ? (resumo.slaCumpridoPercentual == null ? "-" : `${resumo.slaCumpridoPercentual}%`) : "…"}
          detalhe="fechados dentro do prazo da prioridade"
          cor="#10b981"
        />
      </div>

      {resumo && (
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <ChartCard titulo="Chamados por dia" subtitulo={`Abertos e fechados nos últimos ${resumo.dias} dias`} className="lg:col-span-2">
            <LineChart
              rotulos={resumo.porDia.map((d) => diaCurto(d.data))}
              series={[
                { nome: "Abertos", cor: CORES_STATUS.ABERTO, valores: resumo.porDia.map((d) => d.abertos) },
                { nome: "Fechados", cor: CORES_STATUS.FECHADO, valores: resumo.porDia.map((d) => d.fechados) },
              ]}
              vazio="Nenhum chamado aberto ou fechado neste período."
            />
          </ChartCard>

          <ChartCard titulo="Por status" subtitulo="Distribuição atual">
            <DonutChart
              rotuloTotal="chamados"
              itens={resumo.porStatus.map((s) => ({ rotulo: STATUS_LABEL[s.status], valor: s.total, cor: CORES_STATUS[s.status] }))}
            />
          </ChartCard>

          <ChartCard titulo="Por categoria">
            <BarChart itens={resumo.porCategoria.map((c) => ({ rotulo: c.nome, valor: c.total }))} />
          </ChartCard>

          <ChartCard titulo="Por prioridade">
            <BarChart
              itens={resumo.porPrioridade.map((p) => ({ rotulo: p.nome, valor: p.total, cor: COR_POR_NIVEL[p.nivel] }))}
            />
          </ChartCard>

          {resumo.topTecnicos && (
            <ChartCard titulo="Chamados por técnico" subtitulo="Top 5 por volume">
              <BarChart
                itens={resumo.topTecnicos.map((t) => ({ rotulo: t.nome, valor: t.total }))}
                vazio="Nenhum chamado atribuído ainda."
              />
            </ChartCard>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chamados recentes</h2>
        <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:underline">
          Ver todos
        </Link>
      </div>

      {carregando && !resumo ? (
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
