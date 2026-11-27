import { CLASSE_CAMPO, borda, useCampo } from "../hooks/useCampo";
import RodapeCampo from "./RodapeCampo";

export default function InputField({ label, error, ajuda, id, className = "", ...props }) {
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
      <input className={`${CLASSE_CAMPO} ${borda(error)} ${className}`} {...props} {...acessibilidade} />
      <RodapeCampo ajuda={ajuda} error={error} idAjuda={idAjuda} idErro={idErro} />
    </div>
  );
}
