import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ticketService from "../services/ticketService";
import comentarioService from "../services/comentarioService";
import usuarioService from "../services/usuarioService";
import StatusBadge from "../components/StatusBadge";
import AprovacaoBadge from "../components/AprovacaoBadge";
import Botao from "../components/Botao";
import EncaminharModal from "../components/EncaminharModal";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import TextAreaField from "../components/TextAreaField";
import { Carregando, ErroCarregar } from "../components/Estados";
import { useTituloPagina } from "../hooks/useTituloPagina";
import { useAuth } from "../auth/useAuth";
import { PapelUsuario } from "../enum/PapelUsuario";
import { temPermissao } from "../utils/permissoes";
import { STATUS_LABEL } from "../constants/labels";
import { formatDate } from "../utils/formatDate";
import { STATUS_SELECIONAVEIS, podeRetomar, podeSuspender } from "../utils/suspensao";
import { formatarResposta } from "../utils/respostasFormulario";
import { aguardandoAprovacao, bloqueadoPorAprovacao, podeDecidirAprovacao } from "../utils/aprovacao";
import { useNotification } from "../store/useNotification";

export default function TicketDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const [ticket, setTicket] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [suspendendo, setSuspendendo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [atendentes, setAtendentes] = useState([]);
  const [encaminhando, setEncaminhando] = useState(false);
  const [novoColaboradorId, setNovoColaboradorId] = useState("");
  const [falhou, setFalhou] = useState(false);
  const podeGerenciar = temPermissao(usuario, "tickets.tratar");
  useTituloPagina(ticket ? `Chamado #${ticket.id}` : "Chamado");

  async function carregar() {
    try {
      setTicket(await ticketService.buscar(id));
      setFalhou(false);
    } catch {
      setFalhou(true);
    }
  }

  useEffect(() => {
    // Agendada como microtask para não disparar setState de forma síncrona
    // dentro do corpo do efeito (react-hooks/set-state-in-effect).
    Promise.resolve().then(carregar);
    if (usuario.papel === PapelUsuario.ADMIN) {
      usuarioService
        .listar()
        .then((lista) => setTecnicos(lista.filter((u) => u.papel === PapelUsuario.TECNICO)))
        .catch(() => {});
    }
    if (podeGerenciar) {
      usuarioService.atendentes().then(setAtendentes).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function alterarStatus(status) {
    try {
      await ticketService.alterarStatus(id, status);
      notificar("Status atualizado");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível alterar o status", "erro");
    }
  }

  async function suspender(e) {
    e.preventDefault();
    if (!motivo.trim()) {
      notificar("Informe o motivo da suspensão", "erro");
      return;
    }
    setEnviando(true);
    try {
      await ticketService.suspender(id, motivo.trim());
      notificar("Chamado suspenso");
      setSuspendendo(false);
      setMotivo("");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível suspender o chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function retomar() {
    setEnviando(true);
    try {
      await ticketService.retomar(id);
      notificar("Chamado retomado");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível retomar o chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function aprovar() {
    setEnviando(true);
    try {
      await ticketService.aprovar(id);
      notificar("Chamado aprovado");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível aprovar o chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function rejeitar(e) {
    e.preventDefault();
    if (!motivoRejeicao.trim()) {
      notificar("Informe o motivo da rejeição", "erro");
      return;
    }
    setEnviando(true);
    try {
      await ticketService.rejeitar(id, motivoRejeicao.trim());
      notificar("Chamado rejeitado");
      setRejeitando(false);
      setMotivoRejeicao("");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível rejeitar o chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  function cancelarSuspensao() {
    setSuspendendo(false);
    setMotivo("");
  }

  async function encaminhar(tecnicoId, motivoEncaminhamento) {
    setEnviando(true);
    try {
      await ticketService.encaminhar(id, tecnicoId, motivoEncaminhamento);
      notificar("Chamado encaminhado");
      setEncaminhando(false);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível encaminhar o chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function adicionarColaborador(e) {
    e.preventDefault();
    if (!novoColaboradorId) return;
    setEnviando(true);
    try {
      await ticketService.adicionarColaborador(id, Number(novoColaboradorId));
      notificar("Colaborador adicionado");
      setNovoColaboradorId("");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível adicionar o colaborador", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function removerColaborador(colaborador) {
    setEnviando(true);
    try {
      await ticketService.removerColaborador(id, colaborador.id);
      notificar("Colaborador removido");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível remover o colaborador", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function atribuir(tecnicoId) {
    // "Sem atendente" no seletor não é uma atribuição (a API recusaria o id 0).
    if (!tecnicoId) return;
    try {
      await ticketService.atribuir(id, tecnicoId);
      notificar("Chamado atribuído");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível atribuir o chamado", "erro");
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    try {
      await comentarioService.criar(id, mensagem);
      setMensagem("");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Não foi possível enviar o comentário", "erro");
    }
  }

  if (falhou && !ticket) {
    return <ErroCarregar texto="Não foi possível carregar o chamado." onTentarDeNovo={carregar} />;
  }
  if (!ticket) return <Carregando />;

  const colaboradores = ticket.colaboradores ?? [];
  // Mesmas travas da API: chamado fechado ou parado na aprovação do gestor.
  const podeMexerEmColaboradores = podeGerenciar && ticket.status !== "FECHADO" && !bloqueadoPorAprovacao(ticket);
  // Quem ainda pode entrar: nem o responsável, nem o solicitante, nem quem já colabora.
  const idsForaDaLista = new Set([ticket.tecnico?.id, ticket.solicitante?.id, ...colaboradores.map((c) => c.id)]);
  const candidatosColaborador = atendentes.filter((a) => !idsForaDaLista.has(a.id));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          <span className="font-normal text-gray-500">#{ticket.id}</span> {ticket.titulo}
        </h1>
        <div className="flex flex-wrap gap-1 sm:flex-col sm:items-end">
          <StatusBadge status={ticket.status} />
          <AprovacaoBadge ticket={ticket} />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-4 text-sm text-gray-700">{ticket.descricao}</p>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
          <span>Categoria: {ticket.categoria?.nome}</span>
          <span>Prioridade: {ticket.prioridade?.nome}</span>
          <span>Setor: {ticket.departamento?.nome || "Não informado"}</span>
          <span>Solicitante: {ticket.solicitante?.nome}</span>
          <span>Atendente: {ticket.tecnico?.nome || "Sem atendente"}</span>
          <span>Aberto em: {formatDate(ticket.createdAt)}</span>
          {ticket.closedAt && <span>Fechado em: {formatDate(ticket.closedAt)}</span>}
        </div>
      </div>

      {ticket.respostasFormulario?.length > 0 && (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4" aria-label="Dados do formulário">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Informações do assunto{ticket.assunto ? `: ${ticket.assunto.nome}` : ""}
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            {ticket.respostasFormulario.map((r) => (
              <div key={r.campoId}>
                <dt className="text-xs text-gray-500">{r.rotulo}</dt>
                <dd className="text-gray-800">{formatarResposta(r)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {aguardandoAprovacao(ticket) && (
        <div role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Este chamado aguarda a aprovação do gestor do setor.</p>
          <p className="text-xs">Enquanto isso o atendimento fica parado.</p>

          {podeDecidirAprovacao(usuario, ticket) && !rejeitando && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Botao type="button" onClick={aprovar} disabled={enviando}>Aprovar</Botao>
              <Botao type="button" variante="perigo" onClick={() => setRejeitando(true)} disabled={enviando}>Rejeitar</Botao>
            </div>
          )}

          {rejeitando && (
            <form onSubmit={rejeitar} className="mt-3 flex flex-col gap-2">
              <TextAreaField
                id="motivo-rejeicao"
                label="Motivo da rejeição"
                required
                maxLength={1000}
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                ajuda="Rejeitar encerra o chamado e o solicitante é avisado com o motivo."
              />
              <div className="flex flex-wrap gap-2">
                <Botao type="submit" variante="perigo" disabled={enviando || !motivoRejeicao.trim()}>Confirmar rejeição</Botao>
                <Botao type="button" variante="secundario" onClick={() => { setRejeitando(false); setMotivoRejeicao(""); }}>Cancelar</Botao>
              </div>
            </form>
          )}
        </div>
      )}

      {ticket.aprovacaoStatus === "REJEITADA" && (
        <div role="status" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Rejeitado por {ticket.aprovador?.nome || "gestor"}
          {ticket.aprovacaoMotivo ? `. Motivo: ${ticket.aprovacaoMotivo}` : "."}
        </div>
      )}

      {podeGerenciar && !bloqueadoPorAprovacao(ticket) && (
        <section aria-label="Atendimento" className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
          {podeRetomar(ticket) ? (
            <Botao type="button" onClick={retomar} disabled={enviando}>Retomar</Botao>
          ) : (
            <SelectField
              label="Status"
              value={ticket.status}
              onChange={(e) => alterarStatus(e.target.value)}
              options={STATUS_SELECIONAVEIS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
          )}

          {podeSuspender(ticket) && !suspendendo && (
            <Botao type="button" variante="secundario" onClick={() => setSuspendendo(true)}>Suspender</Botao>
          )}

          {ticket.status !== "FECHADO" && (
            <Botao type="button" variante="secundario" onClick={() => setEncaminhando(true)} disabled={enviando}>Encaminhar</Botao>
          )}

          {usuario.papel === PapelUsuario.TECNICO && !ticket.tecnico && (
            <Botao type="button" onClick={() => atribuir(usuario.id)}>Atribuir a mim</Botao>
          )}

          {usuario.papel === PapelUsuario.ADMIN && (
            <SelectField
              label="Atribuir a"
              placeholder="Sem atendente"
              value={ticket.tecnico?.id || ""}
              onChange={(e) => atribuir(Number(e.target.value))}
              options={tecnicos.map((t) => ({ value: t.id, label: t.nome }))}
            />
          )}

          {suspendendo && (
            <form onSubmit={suspender} className="flex w-full flex-col gap-2">
              <TextAreaField
                id="motivo-suspensao"
                label="Motivo da suspensão"
                required
                maxLength={1000}
                placeholder="Ex.: aguardando peça do fornecedor"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                ajuda="O motivo fica registrado como comentário e o solicitante é avisado."
              />
              <div className="flex flex-wrap gap-2">
                <Botao type="submit" disabled={enviando || !motivo.trim()}>Confirmar suspensão</Botao>
                <Botao type="button" variante="secundario" onClick={cancelarSuspensao}>Cancelar</Botao>
              </div>
            </form>
          )}
        </section>
      )}

      {(colaboradores.length > 0 || podeMexerEmColaboradores) && (
        <section aria-labelledby="titulo-colaboradores" className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 id="titulo-colaboradores" className="mb-2 text-sm font-semibold text-gray-900">Colaboradores</h2>
          {colaboradores.length === 0 ? (
            <p className="mb-3 text-sm text-gray-500">Nenhum colaborador neste chamado.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-1">
              {colaboradores.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm text-gray-800">
                  <span>{c.nome}</span>
                  {podeMexerEmColaboradores && (
                    <Botao
                      type="button"
                      variante="linkPerigo"
                      className="text-xs"
                      aria-label={`Remover ${c.nome} dos colaboradores`}
                      onClick={() => removerColaborador(c)}
                      disabled={enviando}
                    >
                      Remover
                    </Botao>
                  )}
                </li>
              ))}
            </ul>
          )}

          {podeMexerEmColaboradores && (
            <form onSubmit={adicionarColaborador} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <SelectField
                label="Adicionar colaborador"
                placeholder="Selecione…"
                value={novoColaboradorId}
                onChange={(e) => setNovoColaboradorId(e.target.value)}
                options={candidatosColaborador.map((a) => ({ value: a.id, label: a.nome }))}
              />
              <Botao type="submit" disabled={enviando || !novoColaboradorId}>Adicionar</Botao>
            </form>
          )}
        </section>
      )}

      {encaminhando && (
        <EncaminharModal
          atendentes={atendentes.filter((a) => a.id !== ticket.tecnico?.id)}
          enviando={enviando}
          onConfirmar={encaminhar}
          onCancelar={() => setEncaminhando(false)}
        />
      )}

      <h2 id="titulo-comentarios" className="mb-2 text-lg font-semibold text-gray-900">Comentários</h2>
      <div className="mb-4 flex flex-col gap-2">
        {ticket.comentarios?.map((c) => (
          <div key={c.id} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">{c.usuario.nome} — {formatDate(c.createdAt)}</p>
            <p className="whitespace-pre-line break-words text-gray-800">{c.mensagem}</p>
          </div>
        ))}
        {ticket.comentarios?.length === 0 && <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>}
      </div>

      <form onSubmit={enviarComentario} aria-labelledby="titulo-comentarios" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor="novo-comentario" className="sr-only">Novo comentário</label>
        <div className="flex-1">
          <InputField
            id="novo-comentario"
            placeholder="Escreva um comentário…"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>
        <Botao type="submit">Enviar</Botao>
      </form>
    </div>
  );
}
