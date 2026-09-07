import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ticketService from "../services/ticketService";
import comentarioService from "../services/comentarioService";
import usuarioService from "../services/usuarioService";
import StatusBadge from "../components/StatusBadge";
import Botao from "../components/Botao";
import { useAuth } from "../auth/AuthContext";
import { PapelUsuario } from "../enum/PapelUsuario";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";
import { formatDate } from "../utils/formatDate";
import { useNotification } from "../store/NotificationContext";

export default function TicketDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const [ticket, setTicket] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const podeGerenciar = usuario.papel === PapelUsuario.ADMIN || usuario.papel === PapelUsuario.TECNICO;

  async function carregar() {
    setTicket(await ticketService.buscar(id));
  }

  useEffect(() => {
    carregar();
    if (usuario.papel === PapelUsuario.ADMIN) {
      usuarioService.listar().then((lista) => setTecnicos(lista.filter((u) => u.papel === PapelUsuario.TECNICO)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function alterarStatus(status) {
    await ticketService.alterarStatus(id, status);
    notificar("Status atualizado");
    carregar();
  }

  async function atribuir(tecnicoId) {
    await ticketService.atribuir(id, tecnicoId);
    notificar("Chamado atribuído");
    carregar();
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    await comentarioService.criar(id, mensagem);
    setMensagem("");
    carregar();
  }

  if (!ticket) return <p className="text-sm text-gray-500">Carregando…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{ticket.titulo}</h1>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-4 text-sm text-gray-700">{ticket.descricao}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <span>Categoria: {ticket.categoria?.nome}</span>
          <span>Prioridade: {ticket.prioridade?.nome}</span>
          <span>Solicitante: {ticket.solicitante?.nome}</span>
          <span>Técnico: {ticket.tecnico?.nome || "Não atribuído"}</span>
          <span>Aberto em: {formatDate(ticket.createdAt)}</span>
          {ticket.closedAt && <span>Fechado em: {formatDate(ticket.closedAt)}</span>}
        </div>
      </div>

      {podeGerenciar && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Status:
            <select
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              value={ticket.status}
              onChange={(e) => alterarStatus(e.target.value)}
            >
              {Object.values(StatusTicket).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>

          {usuario.papel === PapelUsuario.TECNICO && !ticket.tecnico && (
            <Botao onClick={() => atribuir(usuario.id)}>Atribuir a mim</Botao>
          )}

          {usuario.papel === PapelUsuario.ADMIN && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Atribuir a:
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={ticket.tecnico?.id || ""}
                onChange={(e) => atribuir(Number(e.target.value))}
              >
                <option value="">Não atribuído</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold text-gray-900">Comentários</h2>
      <div className="mb-4 flex flex-col gap-2">
        {ticket.comentarios?.map((c) => (
          <div key={c.id} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">{c.usuario.nome} — {formatDate(c.createdAt)}</p>
            <p className="text-gray-800">{c.mensagem}</p>
          </div>
        ))}
        {ticket.comentarios?.length === 0 && <p className="text-sm text-gray-400">Nenhum comentário ainda.</p>}
      </div>

      <form onSubmit={enviarComentario} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Escreva um comentário…"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
        <Botao type="submit">Enviar</Botao>
      </form>
    </div>
  );
}
