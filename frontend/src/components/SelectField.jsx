export default function SelectField({ label, options, placeholder, className = "", children, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      {label && <span className="font-medium">{label}</span>}
      <select
        className={`rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${className}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
        {children}
      </select>
    </label>
  );
}
