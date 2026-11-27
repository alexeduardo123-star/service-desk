import { Link } from "react-router-dom";
import { VARIANTES_BOTAO } from "../constants/botao";

// Link com cara de botão (ex.: "Novo chamado"), no mesmo visual do Botao.
export default function LinkBotao({ variante = "primario", className = "", ...props }) {
  return <Link className={`inline-block text-sm transition-colors ${VARIANTES_BOTAO[variante]} ${className}`} {...props} />;
}
