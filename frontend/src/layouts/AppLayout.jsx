import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PAPEL_LABEL } from "../constants/labels";
import { NOME_APP } from "../constants/marca";
import Botao from "../components/Botao";
import Logo from "../components/Logo";
import MenuConfiguracoes from "../components/MenuConfiguracoes";
import SinoNotificacoes from "../components/SinoNotificacoes";
import configuracaoService from "../services/configuracaoService";
import permissaoService from "../services/permissaoService";
import { temPermissao } from "../utils/permissoes";
import { salvarPreferencias } from "../utils/preferencias";

const linkClasse = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

function Navegacao({ usuario, onNavegar, id }) {
  const podeVer = (chave) => temPermissao(usuario, chave);
  return (
    <nav id={id} aria-label="Menu principal" className="flex flex-col gap-1">
      <NavLink to="/home" className={linkClasse} onClick={onNavegar}>Dashboard</NavLink>
      <NavLink to="/tickets" className={linkClasse} onClick={onNavegar}>Chamados</NavLink>
      <NavLink to="/kanban" className={linkClasse} onClick={onNavegar}>Kanban</NavLink>
      <NavLink to="/kb" className={linkClasse} onClick={onNavegar}>Base de Conhecimento</NavLink>
      <NavLink to="/notificacoes" className={linkClasse} onClick={onNavegar}>Notificações</NavLink>
      {podeVer("agenda.ver") && <NavLink to="/agenda" className={linkClasse} onClick={onNavegar}>Agenda</NavLink>}
      {podeVer("relatorios.ver") && <NavLink to="/relatorios" className={linkClasse} onClick={onNavegar}>Relatórios</NavLink>}
    </nav>
  );
}

function IconeMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Menu lateral no celular/tablet: abre por cima do conteúdo, fecha com Esc, no
// fundo escuro ou ao escolher uma tela, e devolve o foco ao botão do menu.
function MenuGaveta({ usuario, onFechar }) {
  const painel = useRef(null);

  useEffect(() => {
    const botaoMenu = document.activeElement;
    painel.current?.querySelector("a")?.focus();
    const esc = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      if (botaoMenu instanceof HTMLElement) botaoMenu.focus();
    };
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onFechar} />
      <div ref={painel} className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col bg-white p-4 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button type="button" aria-label="Fechar menu" onClick={onFechar} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100">
            <IconeFechar />
          </button>
        </div>
        <Navegacao usuario={usuario} id="menu-principal" onNavegar={onFechar} />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { usuario, logout, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const fecharMenu = useCallback(() => setMenuAberto(false), []);

  // Carrega as preferências de exibição (fuso, itens por página) do backend
  // e guarda em cache para o restante do app usar.
  useEffect(() => {
    configuracaoService
      .obter()
      .then(salvarPreferencias)
      .catch(() => {});
    // Pega as permissões atuais do perfil: o administrador pode ter mudado algo
    // desde o login.
    permissaoService
      .minhas()
      .then(({ permissoes }) => atualizarUsuario({ permissoes }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
      >
        Pular para o conteúdo
      </a>

      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 md:block print:hidden">
        <div className="mb-6"><Logo /></div>
        <Navegacao usuario={usuario} />
      </aside>

      {menuAberto && <MenuGaveta usuario={usuario} onFechar={fecharMenu} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 print:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-md p-1.5 text-gray-700 hover:bg-gray-100 md:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              aria-controls="menu-principal"
              onClick={() => setMenuAberto(true)}
            >
              <IconeMenu />
            </button>
            <div className="md:hidden"><Logo /></div>
            <p className="hidden truncate text-sm text-gray-700 sm:block">
              {usuario?.nome} <span className="text-gray-500">— {PAPEL_LABEL[usuario?.papel]}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <SinoNotificacoes />
            <MenuConfiguracoes usuario={usuario} />
            <Botao type="button" variante="linkPerigo" onClick={handleLogout}>
              Sair
            </Botao>
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-500 print:hidden">
          {NOME_APP} — Projeto acadêmico
        </footer>
      </div>
    </div>
  );
}
