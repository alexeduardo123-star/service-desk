import Botao from "./Botao";

// Estados padrão de listas e telas: carregando, vazio e erro ao carregar.
// role="status" faz o leitor de tela anunciar a troca de estado.

export function Carregando({ texto = "Carregando…" }) {
  return (
    <p role="status" className="text-sm text-gray-600">
      {texto}
    </p>
  );
}

export function Vazio({ texto = "Nenhum registro encontrado.", children }) {
  return (
    <div role="status" className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
      <p>{texto}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function ErroCarregar({ texto = "Não foi possível carregar os dados.", onTentarDeNovo }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{texto}</p>
      {onTentarDeNovo && (
        <Botao type="button" variante="secundario" className="mt-3" onClick={onTentarDeNovo}>
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}
