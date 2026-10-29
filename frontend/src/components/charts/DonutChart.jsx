import { PALETA } from "../../constants/cores";
import { fatiasDonut } from "../../utils/charts";

// Gráfico de rosca com o total no centro e legenda ao lado.
export default function DonutChart({ itens, rotuloTotal = "total", vazio = "Sem dados no período." }) {
  const coloridos = (itens ?? []).map((item, i) => ({ ...item, cor: item.cor ?? PALETA[i % PALETA.length] }));
  const total = coloridos.reduce((soma, i) => soma + i.valor, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-gray-400">{vazio}</p>;

  const fatias = fatiasDonut(coloridos);

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 100 100" className="h-36 w-36" role="img" aria-label={`Gráfico de rosca, ${total} ${rotuloTotal}`}>
        {/* gira -90° para a primeira fatia começar no topo (12h) */}
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {fatias.map((f) => (
            <circle
              key={f.rotulo}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={f.cor}
              strokeWidth="14"
              strokeDasharray={`${f.comprimento} ${f.resto}`}
              strokeDashoffset={f.deslocamento}
            />
          ))}
        </g>
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 text-[16px] font-bold">
          {total}
        </text>
      </svg>

      <ul className="flex flex-col gap-1 text-sm">
        {coloridos.map((item) => (
          <li key={item.rotulo} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.cor }} aria-hidden="true" />
            <span className="text-gray-600">{item.rotulo}</span>
            <span className="font-medium text-gray-900">{item.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
