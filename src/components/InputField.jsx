export default function InputField({ label, error, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        className={`rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
