import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../components/Botao";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Paginacao from "../components/Paginacao";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import notificacaoService from "../services/notificacaoService";
import usuarioService from "../services/usuarioService";
import { PapelUsuario, PAPEL_USUARIO_VALORES } from "../enum/PapelUsuario";
import { PAPEL_LABEL, TIPO_NOTIFICACAO_COR, TIPO_NOTIFICACAO_LABEL } from "../constants/labels";
import { formatDate } from "../utils/formatDate";
import { tempoRelativo } from "../utils/tempoRelativo";
import { paginar } from "../utils/paginar";
import { lerPreferencias } from "../utils/preferencias";

const FORM_VAZIO = { titulo: "", mensagem: "", destinoTipo: "TODOS", papel: PapelUsuario.TECNICO, usuarioId: "" };

const OPCOES_TIPO = Object.entries(TIPO_NOTIFICACAO_LABEL).map(([value, label]) => ({ value, label }));

export default function Notificacoes() {
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const isAdmin = usuario.papel === PapelUsuario.ADMIN;

  const [notificacoes, setNotificacoes] = useState([]);
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const carregar = useCallback(async () => {
    const filtros = {};
    if (apenasNaoLidas) filtros.lida = false;
    if (tipoFiltro) filtros.tipo = tipoFiltro;
    try {
      setNotificacoes(await notificacaoService.listar(filtros));
    } catch {
      notificar("Erro ao carregar notificações", "erro");
    } finally {
      setCarregando(false);
    }
  }, [apenasNaoLidas, tipoFiltro, notificar]);

  useEffect(() => {
    // Agendada como microtask para não disparar setState de forma síncrona
    // dentro do corpo do efeito (react-hooks/set-state-in-effect).
    Promise.resolve().then(carregar);
  }, [carregar]);

  useEffect(() => {
    if (isAdmin) usuarioService.listar().then(setUsuarios).catch(() => {});
  }, [isAdmin]);

  function mudarFiltro(setter, valor) {
    setter(valor);
    setPagina(1);
  }

  async function alternarLida(n) {
    try {
      await notificacaoService.marcarLida(n.id, !n.lida);
      carregar();
    } catch {
      notificar("Erro ao atualizar a notificação", "erro");
    }
  }

  async function abrir(n) {
    if (n.lida) return;
    try {
      await notificacaoService.marcarLida(n.id, true);
    } catch {
      // o clique no link continua funcionando mesmo se marcar como lida falhar
    }
  }

  async function marcarTodas() {
    try {
      const { atualizadas } = await notificacaoService.marcarTodasLidas();
      notificar(atualizadas > 0 ? `${atualizadas} notificações marcadas como lidas` : "Nenhuma notificação pendente");
      carregar();
    } catch {
      notificar("Erro ao marcar como lidas", "erro");
    }
  }

  async function excluir(id) {
    try {
      await notificacaoService.excluir(id);
      notificar("Notificação excluída");
      carregar();
    } catch {
      notificar("Erro ao excluir a notificação", "erro");
    }
  }

  async function limparLidas() {
    if (!confirm("Excluir todas as notificações já lidas?")) return;
    try {
      const { excluidas } = await notificacaoService.excluirLidas();
      notificar(`${excluidas} notificações excluídas`);
      carregar();
    } catch {
      notificar("Erro ao limpar notificações", "erro");
    }
  }

  async function enviarComunicado(e) {
    e.preventDefault();
    const destino = { tipo: form.destinoTipo };
    if (form.destinoTipo === "PAPEL") destino.papel = form.papel;
    if (form.destinoTipo === "USUARIO") destino.usuarioId = Number(form.usuarioId);

    try {
      const { enviadas } = await notificacaoService.criar({ titulo: form.titulo, mensagem: form.mensagem, destino });
      notificar(`Comunicado enviado para ${enviadas} usuário(s)`);
      setForm(null);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao enviar o comunicado", "erro");
    }
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const { itens, ...paginacao } = paginar(notificacoes, pagina, lerPreferencias().itensPorPagina);

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500">
            {naoLidas > 0 ? `${naoLidas} não lida(s) nesta lista` : "Você está em dia com os avisos."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" onClick={marcarTodas}>
            Marcar todas como lidas
          </Botao>
          <Botao variante="secundario" onClick={limparLidas}>
            Limpar lidas
          </Botao>
          {isAdmin && !form && <Botao onClick={() => setForm(FORM_VAZIO)}>Novo comunicado</Botao>}
        </div>
      </div>

      {form && (
        <form onSubmit={enviarComunicado} className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
          <InputField
            label="Título"
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <SelectField
            label="Destinatários"
            value={form.destinoTipo}
            onChange={(e) => setForm({ ...form, destinoTipo: e.target.value })}
            options={[
              { value: "TODOS", label: "Todos os usuários" },
              { value: "PAPEL", label: "Por perfil de acesso" },
              { value: "USUARIO", label: "Um usuário específico" },
            ]}
          />
          {form.destinoTipo === "PAPEL" && (
            <SelectField
              label="Perfil"
              value={form.papel}
              onChange={(e) => setForm({ ...form, papel: e.target.value })}
              options={PAPEL_USUARIO_VALORES.map((p) => ({ value: p, label: PAPEL_LABEL[p] }))}
            />
          )}
          {form.destinoTipo === "USUARIO" && (
            <SelectField
              label="Usuário"
              required
              placeholder="Selecione…"
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
              options={usuarios.map((u) => ({ value: u.id, label: `${u.nome} (${u.email})` }))}
            />
          )}
          <label className="flex flex-col gap-1 text-sm text-gray-700 sm:col-span-2">
            <span className="font-medium">Mensagem</span>
            <textarea
              required
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Botao type="submit">Enviar comunicado</Botao>
            <Botao type="button" variante="secundario" onClick={() => setForm(null)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => mudarFiltro(setApenasNaoLidas, false)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!apenasNaoLidas ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Todas
          </button>
          <button
            onClick={() => mudarFiltro(setApenasNaoLidas, true)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${apenasNaoLidas ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Não lidas
          </button>
        </div>
        <div className="w-48">
          <SelectField
            aria-label="Filtrar por tipo"
            placeholder="Todos os tipos"
            value={tipoFiltro}
            onChange={(e) => mudarFiltro(setTipoFiltro, e.target.value)}
            options={OPCOES_TIPO}
          />
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {itens.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border bg-white p-4 ${n.lida ? "border-gray-200" : "border-l-4 border-blue-500 border-y-gray-200 border-r-gray-200"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TIPO_NOTIFICACAO_COR[n.tipo]}`}>
                      {TIPO_NOTIFICACAO_LABEL[n.tipo]}
                    </span>
                    <h2 className={`text-sm text-gray-900 ${n.lida ? "font-medium" : "font-bold"}`}>{n.titulo}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.mensagem}</p>
                  <p className="mt-1 text-xs text-gray-400" title={formatDate(n.createdAt)}>
                    {tempoRelativo(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  {n.ticketId && (
                    <Link to={`/tickets/${n.ticketId}`} onClick={() => abrir(n)} className="text-blue-600 hover:underline">
                      Ver chamado
                    </Link>
                  )}
                  <button onClick={() => alternarLida(n)} className="text-gray-600 hover:underline">
                    {n.lida ? "Marcar como não lida" : "Marcar como lida"}
                  </button>
                  <button onClick={() => excluir(n.id)} className="text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
          {notificacoes.length === 0 && (
            <li className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
              Nenhuma notificação encontrada.
            </li>
          )}
        </ul>
      )}

      {!carregando && <Paginacao {...paginacao} onChange={setPagina} />}
    </div>
  );
}
