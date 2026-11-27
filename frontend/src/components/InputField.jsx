export default function InputField({ label, error, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        className={`rounded-md border ${error ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
