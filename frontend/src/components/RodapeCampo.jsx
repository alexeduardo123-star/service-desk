// Ajuda e mensagem de erro embaixo de um campo; os ids vêm de useCampo e são
// referenciados pelo aria-describedby do campo.
export default function RodapeCampo({ ajuda, error, idAjuda, idErro }) {
  return (
    <>
      {ajuda && (
        <span id={idAjuda} className="text-xs text-gray-500">
          {ajuda}
        </span>
      )}
      {error && (
        <span id={idErro} role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </>
  );
}
