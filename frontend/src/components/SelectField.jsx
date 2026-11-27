import { CLASSE_CAMPO, borda, useCampo } from "../hooks/useCampo";
import RodapeCampo from "./RodapeCampo";

export default function SelectField({ label, options, placeholder, error, ajuda, id, className = "", children, ...props }) {
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
      <select className={`${CLASSE_CAMPO} ${borda(error)} ${className}`} {...props} {...acessibilidade}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
        {children}
      </select>
      <RodapeCampo ajuda={ajuda} error={error} idAjuda={idAjuda} idErro={idErro} />
    </div>
  );
}
