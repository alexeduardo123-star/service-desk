// Interruptor (checkbox estilizado) com título e descrição.
export default function Toggle({ label, descricao, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-start justify-between gap-4 py-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {descricao && <span className="block text-xs text-gray-500">{descricao}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400"
      />
    </label>
  );
}
