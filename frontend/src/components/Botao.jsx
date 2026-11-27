import { VARIANTES_BOTAO } from "../constants/botao";

// Botão padrão do sistema. O `type` segue o padrão do HTML (submit dentro de
// formulário); botões que não enviam passam `type="button"`.
export default function Botao({ variante = "primario", className = "", ...props }) {
  return (
    <button
      className={`text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES_BOTAO[variante]} ${className}`}
      {...props}
    />
  );
}
