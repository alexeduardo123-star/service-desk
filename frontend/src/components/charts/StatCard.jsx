// Cartão de indicador (número grande + legenda). `destaque` pinta o valor de
// vermelho, usado para alertas como SLA vencido.
export default function StatCard({ titulo, valor, detalhe, cor = "#111827", destaque = false }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
        <p className="text-sm text-gray-500">{titulo}</p>
      </div>
      <p className={`mt-1 text-2xl font-bold ${destaque ? "text-red-600" : "text-gray-900"}`}>{valor}</p>
      {detalhe && <p className="text-xs text-gray-400">{detalhe}</p>}
    </div>
  );
}
