// Campos do formulário do assunto, para preencher ao abrir o chamado.
// campos: [{ id, rotulo, tipo, obrigatorio, opcoes }]; valores: { [id]: valor }.
import { CLASSE_CAMPO } from "../hooks/useCampo";

const classeEntrada = `${CLASSE_CAMPO} border-gray-300`;

function Rotulo({ campo }) {
  return (
    <span className="font-medium">
      {campo.rotulo}
      {campo.obrigatorio && (
        <>
          <span aria-hidden="true" className="text-red-700"> *</span>
          <span className="sr-only"> (obrigatório)</span>
        </>
      )}
    </span>
  );
}

export default function FormularioPreenchimento({ campos = [], valores, onChange }) {
  if (campos.length === 0) return null;

  return (
    <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      <legend className="px-1 text-sm font-semibold text-gray-700">Informações do assunto</legend>

      {campos.map((campo) => {
        const id = `campo-formulario-${campo.id}`;
        const valor = valores[campo.id];

        if (campo.tipo === "CHECKBOX") {
          return (
            <label key={campo.id} htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                id={id}
                type="checkbox"
                className="h-4 w-4"
                checked={valor === true}
                onChange={(e) => onChange(campo.id, e.target.checked)}
              />
              <Rotulo campo={campo} />
            </label>
          );
        }

        let entrada;
        if (campo.tipo === "TEXTO_LONGO") {
          entrada = (
            <textarea id={id} rows={3} maxLength={2000} aria-required={campo.obrigatorio || undefined} className={classeEntrada} value={valor ?? ""} onChange={(e) => onChange(campo.id, e.target.value)} />
          );
        } else if (campo.tipo === "SELECAO") {
          entrada = (
            <select id={id} aria-required={campo.obrigatorio || undefined} className={classeEntrada} value={valor ?? ""} onChange={(e) => onChange(campo.id, e.target.value)}>
              <option value="">Selecione…</option>
              {(campo.opcoes ?? []).map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          );
        } else {
          const tipos = { NUMERO: "number", DATA: "date" };
          entrada = (
            <input id={id} type={tipos[campo.tipo] ?? "text"} maxLength={campo.tipo === "TEXTO" ? 500 : undefined} step={campo.tipo === "NUMERO" ? "any" : undefined} aria-required={campo.obrigatorio || undefined} className={classeEntrada} value={valor ?? ""} onChange={(e) => onChange(campo.id, e.target.value)} />
          );
        }

        return (
          <label key={campo.id} htmlFor={id} className="flex flex-col gap-1 text-sm text-gray-700">
            <Rotulo campo={campo} />
            {entrada}
          </label>
        );
      })}
    </fieldset>
  );
}
