import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { gruposVisiveis } from "../utils/menuConfiguracoes";

// Engrenagem no cabeçalho: abre o menu de Configurações com as preferências da
// pessoa e, para quem tem permissão, os cadastros do administrador.
function IconeEngrenagem() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const itemClasse = ({ isActive }) =>
  `block rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-100"}`;

export default function MenuConfiguracoes({ usuario }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const grupos = gruposVisiveis(usuario);

  const fechar = () => setAberto(false);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label="Configurações"
        title="Configurações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
      >
        <IconeEngrenagem />
      </button>

      {aberto && (
        <nav
          aria-label="Menu de configurações"
          className="absolute right-0 top-full z-20 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
          <NavLink to="/configuracoes" className={itemClasse} onClick={fechar}>
            Minhas preferências
          </NavLink>

          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="mt-2 border-t border-gray-100 pt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase text-gray-400">{grupo.titulo}</p>
              {grupo.itens.map((item) => (
                <NavLink key={item.to} to={item.to} className={itemClasse} onClick={fechar}>
                  {item.rotulo}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
