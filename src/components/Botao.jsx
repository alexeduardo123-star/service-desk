const VARIANTES = {
  primario: "bg-blue-600 hover:bg-blue-700 text-white",
  perigo: "bg-red-600 hover:bg-red-700 text-white",
  secundario: "bg-gray-200 hover:bg-gray-300 text-gray-800",
};

export default function Botao({ variante = "primario", className = "", ...props }) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  );
}
