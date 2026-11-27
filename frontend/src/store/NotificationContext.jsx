import { useCallback, useEffect, useRef, useState } from "react";
import { NotificationContext } from "./notificationContext";

const DURACAO_MS = 4000;

export function NotificationProvider({ children }) {
  const [notificacao, setNotificacao] = useState(null);
  const timer = useRef(null);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    // Um aviso novo reinicia o tempo; sem isso o timer do anterior apagaria o novo antes da hora.
    clearTimeout(timer.current);
    setNotificacao({ mensagem, tipo });
    timer.current = setTimeout(() => setNotificacao(null), DURACAO_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const erro = notificacao?.tipo === "erro";

  return (
    <NotificationContext.Provider value={{ notificar }}>
      {children}
      {/* As duas regiões ficam sempre na página: o leitor de tela só anuncia
          mudanças em regiões que já existiam. Sucesso é educado (polite); erro
          interrompe (role="alert"). */}
      <div aria-live="polite" role="status" className="sr-only">
        {notificacao && !erro ? notificacao.mensagem : ""}
      </div>
      <div role="alert" className="sr-only">
        {notificacao && erro ? notificacao.mensagem : ""}
      </div>
      {notificacao && (
        <div
          aria-hidden="true"
          className={`fixed inset-x-4 bottom-4 z-[60] rounded-lg px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm ${
            erro ? "bg-red-700" : "bg-emerald-700"
          }`}
        >
          {notificacao.mensagem}
        </div>
      )}
    </NotificationContext.Provider>
  );
}
