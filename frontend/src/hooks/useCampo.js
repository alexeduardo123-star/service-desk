import { useId } from "react";

// Visual comum de input/select/textarea (a borda vem de quem usa: cinza ou erro).
export const CLASSE_CAMPO =
  "rounded-md border bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-600";

export const borda = (erro) => (erro ? "border-red-600" : "border-gray-300");

// Liga o campo ao rótulo (htmlFor/id) e às mensagens de ajuda e de erro
// (aria-describedby). As mensagens ficam fora do <label> para não entrarem no
// nome acessível do campo, que deve continuar sendo só o rótulo.
export function useCampo({ id, error, ajuda, describedBy }) {
  const automatico = useId();
  const idCampo = id ?? automatico;
  const idAjuda = ajuda ? `${idCampo}-ajuda` : undefined;
  const idErro = error ? `${idCampo}-erro` : undefined;
  return {
    idCampo,
    idAjuda,
    idErro,
    acessibilidade: {
      id: idCampo,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": [describedBy, idAjuda, idErro].filter(Boolean).join(" ") || undefined,
    },
  };
}
