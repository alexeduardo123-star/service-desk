// Cálculos de geometria dos gráficos SVG. Ficam fora dos componentes para
// serem testáveis sem renderizar nada.

// Teto "redondo" do eixo Y: múltiplo de 4 (mínimo 4), assim as 4 divisões
// da grade sempre caem em números inteiros.
export function escalaMaxima(valores) {
  const max = Math.max(0, ...valores);
  return Math.max(4, Math.ceil(max / 4) * 4);
}

export function marcasEixo(max, divisoes = 4) {
  return Array.from({ length: divisoes + 1 }, (_, i) => (max / divisoes) * i);
}

// Converte uma série de valores em coordenadas dentro da área útil do SVG.
export function pontosLinha(valores, { largura, altura, max, margem = { topo: 10, direita: 10, base: 24, esquerda: 30 } }) {
  const larguraUtil = largura - margem.esquerda - margem.direita;
  const alturaUtil = altura - margem.topo - margem.base;
  const passo = valores.length > 1 ? larguraUtil / (valores.length - 1) : 0;

  return valores.map((valor, i) => ({
    x: margem.esquerda + (valores.length > 1 ? i * passo : larguraUtil / 2),
    y: margem.topo + (1 - valor / max) * alturaUtil,
    valor,
  }));
}

export function pontosParaPath(pontos) {
  return pontos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

// Fatias do gráfico de rosca usando stroke-dasharray num círculo.
export function fatiasDonut(itens, raio = 40) {
  const circunferencia = 2 * Math.PI * raio;
  const visiveis = itens.filter((i) => i.valor > 0);
  const total = visiveis.reduce((soma, i) => soma + i.valor, 0);
  let acumulado = 0;

  return visiveis.map((item) => {
    const fracao = item.valor / total;
    const fatia = {
      ...item,
      percentual: Math.round(fracao * 100),
      comprimento: fracao * circunferencia,
      resto: circunferencia - fracao * circunferencia,
      deslocamento: -acumulado,
    };
    acumulado += fracao * circunferencia;
    return fatia;
  });
}

// "2026-10-27" -> "27/10"
export function diaCurto(chave) {
  const [, mes, dia] = chave.split("-");
  return `${dia}/${mes}`;
}

// "há N horas" legível: 0.5 -> "30 min", 5.25 -> "5,3 h", 60 -> "2,5 dias"
export function formatarHoras(horas) {
  if (horas == null) return "-";
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toFixed(1).replace(".", ",")} h`;
  return `${(horas / 24).toFixed(1).replace(".", ",")} dias`;
}
