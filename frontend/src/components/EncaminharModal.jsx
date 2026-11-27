import { useState } from "react";
import Botao from "./Botao";
import Modal from "./Modal";
import SelectField from "./SelectField";
import TextAreaField from "./TextAreaField";

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
    <Modal titulo="Encaminhar chamado" onFechar={onCancelar}>
      <form onSubmit={confirmar} className="flex flex-col gap-3">
        <SelectField
          label="Encaminhar para"
          placeholder="Selecione o atendente"
          required
          autoFocus
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
          options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
          ajuda={atendentes.length === 0 ? "Não há outro atendente disponível." : undefined}
        />

        <TextAreaField
          label="Motivo"
          required
          minLength={MOTIVO_MIN}
          maxLength={MOTIVO_MAX}
          placeholder="Ex.: problema de rede, precisa do time de infraestrutura"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          ajuda={`O motivo fica registrado no histórico do chamado. (${motivoLimpo.length}/${MOTIVO_MAX})`}
          error={motivoCurto ? `O motivo deve ter pelo menos ${MOTIVO_MIN} caracteres.` : undefined}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao type="button" variante="secundario" onClick={onCancelar}>Cancelar</Botao>
          <Botao type="submit" disabled={!podeConfirmar}>Encaminhar</Botao>
        </div>
      </form>
    </Modal>
  );
}
