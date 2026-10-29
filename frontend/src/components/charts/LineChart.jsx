import { escalaMaxima, marcasEixo, pontosLinha, pontosParaPath } from "../../utils/charts";

const LARGURA = 600;
const ALTURA = 220;
const MARGEM = { topo: 10, direita: 10, base: 24, esquerda: 30 };

// Gráfico de linhas com várias séries. `rotulos` é o eixo X (um por ponto) e
// cada série traz `nome`, `cor` e `valores` do mesmo tamanho.
export default function LineChart({ rotulos, series, vazio = "Sem dados no período." }) {
  const todos = series.flatMap((s) => s.valores);
  if (rotulos.length === 0 || todos.every((v) => v === 0)) {
    return <p className="py-6 text-center text-sm text-gray-400">{vazio}</p>;
  }

  const max = escalaMaxima(todos);
  const config = { largura: LARGURA, altura: ALTURA, max, margem: MARGEM };
  const passoRotulo = Math.ceil(rotulos.length / 7);
  const posicoesX = pontosLinha(rotulos.map(() => 0), config).map((p) => p.x);

  return (
    <div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="h-auto w-full" role="img" aria-label="Gráfico de linhas">
        {marcasEixo(max).map((marca) => {
          const y = MARGEM.topo + (1 - marca / max) * (ALTURA - MARGEM.topo - MARGEM.base);
          return (
            <g key={marca}>
              <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={MARGEM.esquerda - 6} y={y} textAnchor="end" dominantBaseline="central" className="fill-gray-400 text-[10px]">
                {marca}
              </text>
            </g>
          );
        })}

        {rotulos.map((rotulo, i) =>
          i % passoRotulo === 0 ? (
            <text key={rotulo} x={posicoesX[i]} y={ALTURA - 6} textAnchor="middle" className="fill-gray-400 text-[10px]">
              {rotulo}
            </text>
          ) : null
        )}

        {series.map((serie) => {
          const pontos = pontosLinha(serie.valores, config);
          return (
            <g key={serie.nome}>
              <path d={pontosParaPath(pontos)} fill="none" stroke={serie.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pontos.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={serie.cor}>
                  <title>{`${serie.nome} — ${rotulos[i]}: ${p.valor}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex justify-center gap-4 text-xs text-gray-600">
        {series.map((serie) => (
          <li key={serie.nome} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ backgroundColor: serie.cor }} aria-hidden="true" />
            {serie.nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
