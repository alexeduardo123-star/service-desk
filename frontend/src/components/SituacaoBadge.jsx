// Selo "Ativo"/"Inativo" usado nas listagens de cadastros.
export default function SituacaoBadge({ ativo }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        ativo ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}
