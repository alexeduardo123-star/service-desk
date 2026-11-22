import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PAPEL_LABEL } from "../constants/labels";
import SinoNotificacoes from "../components/SinoNotificacoes";
import configuracaoService from "../services/configuracaoService";
import { salvarPreferencias } from "../utils/preferencias";
import usuarioService from "../services/usuarioService";

const linkClasse = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

export default function AppLayout() {
  const { usuario, logout, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.papel === "ADMIN";
  const permissoes = usuario?.permissoes || [];
  const pode = (chave) => isAdmin || permissoes.includes("*") || permissoes.includes(chave);

  // Carrega as preferências de exibição (fuso, itens por página) do backend
  // e guarda em cache para o restante do app usar.
  useEffect(() => {
    usuarioService.me().then(atualizarUsuario).catch(() => {});
    configuracaoService
      .obter()
      .then(salvarPreferencias)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4 print:hidden">
        <h2 className="mb-6 text-lg font-bold text-blue-600">Service Desk</h2>
        <nav className="flex flex-col gap-1">
          <NavLink to="/home" className={linkClasse}>Dashboard</NavLink>
          <NavLink to="/tickets" className={linkClasse}>Chamados</NavLink>
          <NavLink to="/kanban" className={linkClasse}>Kanban</NavLink>
          <NavLink to="/kb" className={linkClasse}>Base de Conhecimento</NavLink>
          <NavLink to="/notificacoes" className={linkClasse}>Notificações</NavLink>
          {(pode("RELATORIOS_ACESSAR") || pode("EQUIPAMENTOS_ACESSAR") || pode("CONTRATOS_ACESSAR")) && (
            <>
              {pode("RELATORIOS_ACESSAR") && <NavLink to="/relatorios" className={linkClasse}>Relatórios</NavLink>}
              {pode("EQUIPAMENTOS_ACESSAR") && <NavLink to="/admin/equipamentos" className={linkClasse}>Equipamentos</NavLink>}
              {pode("CONTRATOS_ACESSAR") && <NavLink to="/admin/contratos" className={linkClasse}>Contratos</NavLink>}
            </>
          )}
          {(pode("USUARIOS_GERENCIAR") || pode("DEPARTAMENTOS_GERENCIAR") || pode("CATEGORIAS_GERENCIAR") || pode("PRIORIDADES_GERENCIAR") || pode("SERVICOS_GERENCIAR") || pode("ASSUNTOS_GERENCIAR") || pode("FORMULARIOS_GERENCIAR") || pode("PERFIS_GERENCIAR")) && (
            <>
              <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase text-gray-400">Administração</p>
              {pode("USUARIOS_GERENCIAR") && <NavLink to="/admin/usuarios" className={linkClasse}>Usuários</NavLink>}
              {pode("PERFIS_GERENCIAR") && <NavLink to="/admin/permissoes" className={linkClasse}>Perfis e permissões</NavLink>}
              {pode("DEPARTAMENTOS_GERENCIAR") && <NavLink to="/admin/departamentos" className={linkClasse}>Setores</NavLink>}
              {pode("CATEGORIAS_GERENCIAR") && <NavLink to="/admin/categorias" className={linkClasse}>Categorias</NavLink>}
              {pode("PRIORIDADES_GERENCIAR") && <NavLink to="/admin/prioridades" className={linkClasse}>Prioridades</NavLink>}
              {pode("SERVICOS_GERENCIAR") && <NavLink to="/admin/servicos" className={linkClasse}>Serviços</NavLink>}
              {pode("ASSUNTOS_GERENCIAR") && <NavLink to="/admin/assuntos" className={linkClasse}>Assuntos</NavLink>}
              {pode("FORMULARIOS_GERENCIAR") && <NavLink to="/admin/formularios" className={linkClasse}>Formulários</NavLink>}
            </>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 print:hidden">
          <div className="text-sm text-gray-600">
            {usuario?.nome} <span className="text-gray-400">— {PAPEL_LABEL[usuario?.papel]}</span>
          </div>
          <div className="flex items-center gap-4">
            <SinoNotificacoes />
            <NavLink to="/configuracoes" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              Configurações
            </NavLink>
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400 print:hidden">
          Service Desk — Projeto acadêmico
        </footer>
      </div>
    </div>
  );
}
