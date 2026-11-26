import { APROVACAO_COR, APROVACAO_LABEL } from "../constants/labels";

// Mostra a situação da aprovação do gestor; some quando o chamado não exige.
export default function AprovacaoBadge({ ticket }) {
  const status = ticket?.aprovacaoStatus;
  if (!APROVACAO_LABEL[status]) return null;

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${APROVACAO_COR[status]}`}>
      {APROVACAO_LABEL[status]}
    </span>
  );
}
