import Botao from "./Botao";

export default function Paginacao({ pagina, totalPaginas, total, onChange }) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <span>
        Página {pagina} de {totalPaginas} — {total} registros
      </span>
      <div className="flex gap-2">
        <Botao variante="secundario" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
          Anterior
        </Botao>
        <Botao variante="secundario" disabled={pagina >= totalPaginas} onClick={() => onChange(pagina + 1)}>
          Próxima
        </Botao>
      </div>
    </div>
  );
}
