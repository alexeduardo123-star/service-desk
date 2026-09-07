import { createContext, useCallback, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificacao, setNotificacao] = useState(null);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notificar }}>
      {children}
      {notificacao && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm shadow-lg text-white ${
            notificacao.tipo === "erro" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {notificacao.mensagem}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
