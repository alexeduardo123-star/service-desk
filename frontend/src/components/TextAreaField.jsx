import { CLASSE_CAMPO, borda, useCampo } from "../hooks/useCampo";
import RodapeCampo from "./RodapeCampo";

// Textarea com rótulo, ajuda e erro ligados, no mesmo padrão do InputField.
export default function TextAreaField({ label, error, ajuda, id, rows = 3, className = "", ...props }) {
  const { idCampo, idAjuda, idErro, acessibilidade } = useCampo({
    id,
    error,
    ajuda,
    describedBy: props["aria-describedby"],
  });
  return (
    <div className="flex flex-col gap-1 text-sm text-gray-700">
      {label && (
        <label htmlFor={idCampo} className="font-medium">
          {label}
        </label>
      )}
      <textarea rows={rows} className={`${CLASSE_CAMPO} ${borda(error)} ${className}`} {...props} {...acessibilidade} />
      <RodapeCampo ajuda={ajuda} error={error} idAjuda={idAjuda} idErro={idErro} />
    </div>
  );
}
