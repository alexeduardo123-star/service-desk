// Mostra como o formulário vai aparecer para quem abrir o chamado.
// Recebe campos no formato { rotulo, tipo, obrigatorio, opcoes }.
import { CLASSE_CAMPO } from "../hooks/useCampo";

const classeEntrada = `${CLASSE_CAMPO} border-gray-300`;

function Rotulo({ campo }) {
  return (
    <span className="font-medium">
      {campo.rotulo || "Campo sem rótulo"}
      {campo.obrigatorio && (
        <>
          <span aria-hidden="true" className="text-red-700"> *</span>
          <span className="sr-only"> (obrigatório)</span>
        </>
      )}
    </span>
  );
}

function CampoPrevia({ campo }) {
  if (campo.tipo === "CHECKBOX") {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="h-4 w-4" />
        <Rotulo campo={campo} />
      </label>
    );
  }

  let entrada;
  if (campo.tipo === "TEXTO_LONGO") {
    entrada = <textarea rows={3} className={classeEntrada} />;
  } else if (campo.tipo === "SELECAO") {
    entrada = (
      <select className={classeEntrada} defaultValue="">
        <option value="">Selecione…</option>
        {(campo.opcoes ?? []).map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    );
  } else {
    const tipos = { NUMERO: "number", DATA: "date" };
    entrada = <input type={tipos[campo.tipo] ?? "text"} className={classeEntrada} />;
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <Rotulo campo={campo} />
      {entrada}
    </label>
  );
}

export default function FormularioPreview({ campos }) {
  if (!campos?.length) {
    return <p className="text-sm text-gray-500">Nenhum campo adicionado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {campos.map((campo, indice) => (
        <CampoPrevia key={campo.chave ?? campo.id ?? indice} campo={campo} />
      ))}
    </div>
  );
}
