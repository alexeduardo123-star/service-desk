import { useId } from "react";

// A mensagem de erro fica fora do <label> (e ligada por aria-describedby) para
// não entrar no nome acessível do campo, que deve continuar sendo só o rótulo.
export default function InputField({ label, error, className = "", ...props }) {
  const idErro = useId();
  return (
    <div className="flex flex-col gap-1 text-sm text-gray-700">
      <label className="flex flex-col gap-1">
        {label && <span className="font-medium">{label}</span>}
        <input
          className={`rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idErro : undefined}
          {...props}
        />
      </label>
      {error && (
        <span id={idErro} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
