import { useState } from "react";
import Botao from "./Botao";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { instanteDeLocal, localDeInstante } from "../utils/agenda";

// Formulário de atendimento agendado. `inicial` traz os valores (ISO) quando é
// edição; `dia` ("AAAA-MM-DD") pré-preenche um atendimento novo das 09h às 10h.
// onSalvar recebe o corpo já no formato da API.
export default function AgendamentoForm({ inicial, dia, atendentes = [], podeEscolherAtendente, atendenteInicial, onSalvar, onCancelar, salvando }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [inicio, setInicio] = useState(inicial ? localDeInstante(inicial.inicio) : `${dia}T09:00`);
  const [fim, setFim] = useState(inicial ? localDeInstante(inicial.fim) : `${dia}T10:00`);
  const [ticketId, setTicketId] = useState(inicial?.ticket?.id ? String(inicial.ticket.id) : "");
  const [atendenteId, setAtendenteId] = useState(String(inicial?.atendente?.id ?? atendenteInicial ?? ""));
  const [erros, setErros] = useState({});

  function validar() {
    const e = {};
    if (titulo.trim().length < 2) e.titulo = "Informe o título";
    const i = instanteDeLocal(inicio);
    const f = instanteDeLocal(fim);
    if (!i) e.inicio = "Informe o início";
    if (!f) e.fim = "Informe o fim";
    if (i && f && new Date(f) <= new Date(i)) e.fim = "O fim deve ser depois do início";
    else if (i && f && new Date(f) - new Date(i) > 12 * 3_600_000) e.fim = "O atendimento pode durar no máximo 12 horas";
    if (ticketId && !/^[1-9]\d*$/.test(ticketId.trim())) e.ticketId = "Informe só o número do chamado";
    return e;
  }

  function enviar(evento) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    onSalvar({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      inicio: instanteDeLocal(inicio),
      fim: instanteDeLocal(fim),
      ticketId: ticketId.trim() ? Number(ticketId) : null,
      ...(atendenteId && { atendenteId: Number(atendenteId) }),
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4" aria-label="Atendimento">
      <h3 className="text-sm font-semibold text-gray-900">{inicial ? "Editar atendimento" : "Novo atendimento"}</h3>

      <InputField label="Título" value={titulo} maxLength={120} error={erros.titulo} onChange={(e) => setTitulo(e.target.value)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Início" type="datetime-local" value={inicio} error={erros.inicio} onChange={(e) => setInicio(e.target.value)} />
        <InputField label="Fim" type="datetime-local" value={fim} error={erros.fim} onChange={(e) => setFim(e.target.value)} />
      </div>

      {podeEscolherAtendente && (
        <SelectField
          label="Atendente"
          value={atendenteId}
          onChange={(e) => setAtendenteId(e.target.value)}
          options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
        />
      )}

      <InputField
        label="Chamado (opcional)"
        inputMode="numeric"
        placeholder="Número do chamado"
        value={ticketId}
        error={erros.ticketId}
        onChange={(e) => setTicketId(e.target.value)}
      />

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Descrição (opcional)</span>
        <textarea
          rows={2}
          maxLength={500}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </label>

      <div className="flex gap-2">
        <Botao type="submit" disabled={salvando}>{inicial ? "Salvar alterações" : "Agendar"}</Botao>
        <Botao type="button" variante="secundario" onClick={onCancelar}>Cancelar</Botao>
      </div>
    </form>
  );
}
