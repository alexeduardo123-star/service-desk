import { NOME_APP } from "../constants/marca";

// Logo do FlowDesk: um "F" formado por traços arredondados e uma onda (o "flow")
// embaixo. O mesmo desenho está em public/favicon.svg e public/logo-flowdesk.svg.
export default function Logo({ tamanho = 32, mostrarNome = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 64 64"
        role="img"
        aria-label={`Logo ${NOME_APP}`}
      >
        <rect width="64" height="64" rx="16" fill="#2563eb" />
        <path
          d="M20 47V19a4 4 0 0 1 4-4h22"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 32h18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M28 47c5 0 5-6 10-6s5 6 10 6"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {mostrarNome && (
        <span className="text-lg font-bold text-gray-900">
          Flow<span className="text-blue-600">Desk</span>
        </span>
      )}
    </span>
  );
}
