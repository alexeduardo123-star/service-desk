import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import notificacaoService, { EVENTO_NOTIFICACOES } from "../services/notificacaoService";

const INTERVALO_MS = 30000;

// Sino do cabeçalho com o contador de notificações não lidas. Atualiza a cada
// 30s e imediatamente quando a central de notificações altera alguma coisa.
export default function SinoNotificacoes() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ativo = true;
    const atualizar = () =>
      notificacaoService
        .contarNaoLidas()
        .then((n) => ativo && setTotal(n))
        .catch(() => {});

    atualizar();
    const timer = setInterval(atualizar, INTERVALO_MS);
    window.addEventListener(EVENTO_NOTIFICACOES, atualizar);
    return () => {
      ativo = false;
      clearInterval(timer);
      window.removeEventListener(EVENTO_NOTIFICACOES, atualizar);
    };
  }, []);

  return (
    <Link
      to="/notificacoes"
      aria-label={total > 0 ? `Notificações (${total} não lidas)` : "Notificações"}
      className="relative rounded-full p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {total > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}
