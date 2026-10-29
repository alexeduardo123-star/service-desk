import { PALETA } from "../../constants/cores";

// Barras horizontais: rótulo à esquerda, barra proporcional ao maior valor e
// o número à direita. Cada item pode trazer a própria `cor`.
export default function BarChart({ itens, vazio = "Sem dados no período." }) {
  if (!itens || itens.length === 0) return <p className="py-6 text-center text-sm text-gray-400">{vazio}</p>;

  const max = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ul className="flex flex-col gap-2" aria-label="Gráfico de barras">
      {itens.map((item, i) => (
        <li key={item.rotulo} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-sm">
          <span className="truncate text-gray-600" title={item.rotulo}>
            {item.rotulo}
          </span>
          <div className="h-3 rounded-full bg-gray-100">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${(item.valor / max) * 100}%`, backgroundColor: item.cor ?? PALETA[i % PALETA.length] }}
            />
          </div>
          <span className="text-right font-medium text-gray-900">{item.valor}</span>
        </li>
      ))}
    </ul>
  );
}
