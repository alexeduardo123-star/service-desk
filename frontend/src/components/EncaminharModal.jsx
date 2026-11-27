import { useState } from "react";
import Botao from "./Botao";
import SelectField from "./SelectField";

export const MOTIVO_MIN = 5;
export const MOTIVO_MAX = 500;

// Modal para passar o chamado a outro atendente. `atendentes` já chega sem o
// atendente atual; o motivo segue as mesmas regras do encaminharSchema da API.
export default function EncaminharModal({ atendentes, enviando, onConfirmar, onCancelar }) {
  const [tecnicoId, setTecnicoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const motivoLimpo = motivo.trim();
  const motivoCurto = motivoLimpo.length > 0 && motivoLimpo.length < MOTIVO_MIN;
  const podeConfirmar = tecnicoId !== "" && motivoLimpo.length >= MOTIVO_MIN && !enviando;

  function confirmar(e) {
    e.preventDefault();
    if (!podeConfirmar) return;
    onConfirmar(Number(tecnicoId), motivoLimpo);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-encaminhar"
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg"
      >
        <h2 id="titulo-encaminhar" className="mb-4 text-lg font-semibold text-gray-900">Encaminhar chamado</h2>

        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <SelectField
            label="Encaminhar para"
            placeholder="Selecione o atendente"
            required
            autoFocus
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
            options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
          />
          {atendentes.length === 0 && (
            <p className="text-xs text-gray-500">Não há outro atendente disponível.</p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="motivo-encaminhamento" className="text-sm font-medium text-gray-700">
              Motivo
            </label>
            <textarea
              id="motivo-encaminhamento"
              rows={3}
              required
              minLength={MOTIVO_MIN}
              maxLength={MOTIVO_MAX}
              aria-describedby="ajuda-motivo-encaminhamento"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex.: problema de rede, precisa do time de infraestrutura"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <p id="ajuda-motivo-encaminhamento" className={`text-xs ${motivoCurto ? "text-red-600" : "text-gray-500"}`}>
              {motivoCurto
                ? `O motivo deve ter pelo menos ${MOTIVO_MIN} caracteres.`
                : "O motivo fica registrado no histórico do chamado."}{" "}
              ({motivoLimpo.length}/{MOTIVO_MAX})
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Botao type="button" variante="secundario" onClick={onCancelar}>Cancelar</Botao>
            <Botao type="submit" disabled={!podeConfirmar}>Encaminhar</Botao>
          </div>
        </form>
      </div>
    </div>
  );
}
