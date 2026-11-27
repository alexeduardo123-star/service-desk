import { useTituloPagina } from "../hooks/useTituloPagina";

// Cabeçalho padrão das telas: título (h1), descrição opcional e ações à direita
// (no celular as ações descem para baixo do título). Também atualiza o título
// da aba do navegador.
export default function CabecalhoPagina({ titulo, descricao, children, className = "" }) {
  useTituloPagina(titulo);
  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-gray-600">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
