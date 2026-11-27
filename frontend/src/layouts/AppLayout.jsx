import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PAPEL_LABEL } from "../constants/labels";
import { NOME_APP } from "../constants/marca";
import Logo from "../components/Logo";
import SinoNotificacoes from "../components/SinoNotificacoes";
import configuracaoService from "../services/configuracaoService";
import permissaoService from "../services/permissaoService";
import { temPermissao, temAlgumaPermissao } from "../utils/permissoes";
import { salvarPreferencias } from "../utils/preferencias";

const linkClasse = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

export default function AppLayout() {
  const { usuario, logout, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const podeVer = (chave) => temPermissao(usuario, chave);
  const mostraCadastros = temAlgumaPermissao(usuario, [
    "usuarios.gerenciar",
    "cadastros.gerenciar",
    "permissoes.gerenciar",
  ]);

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
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4 print:hidden">
        <div className="mb-6"><Logo /></div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/home" className={linkClasse}>Dashboard</NavLink>
          <NavLink to="/tickets" className={linkClasse}>Chamados</NavLink>
          <NavLink to="/kanban" className={linkClasse}>Kanban</NavLink>
          <NavLink to="/kb" className={linkClasse}>Base de Conhecimento</NavLink>
          <NavLink to="/notificacoes" className={linkClasse}>Notificações</NavLink>
          {podeVer("relatorios.ver") && <NavLink to="/relatorios" className={linkClasse}>Relatórios</NavLink>}
          {podeVer("equipamentos.gerenciar") && (
            <NavLink to="/admin/equipamentos" className={linkClasse}>Equipamentos</NavLink>
          )}
          {podeVer("fornecedores.ver") && (
            <NavLink to="/admin/fornecedores" className={linkClasse}>Fornecedores</NavLink>
          )}
          {podeVer("contratos.ver") && <NavLink to="/admin/contratos" className={linkClasse}>Contratos</NavLink>}
          {mostraCadastros && (
            <>
              <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase text-gray-400">Administração</p>
              {podeVer("usuarios.gerenciar") && <NavLink to="/admin/usuarios" className={linkClasse}>Usuários</NavLink>}
              {podeVer("permissoes.gerenciar") && (
                <NavLink to="/admin/perfis" className={linkClasse}>Perfis e permissões</NavLink>
              )}
              {podeVer("cadastros.gerenciar") && (
                <>
                  <NavLink to="/admin/departamentos" className={linkClasse}>Setores</NavLink>
                  <NavLink to="/admin/categorias" className={linkClasse}>Categorias</NavLink>
                  <NavLink to="/admin/prioridades" className={linkClasse}>Prioridades</NavLink>
                  <NavLink to="/admin/servicos" className={linkClasse}>Serviços</NavLink>
                  <NavLink to="/admin/assuntos" className={linkClasse}>Assuntos</NavLink>
                  <NavLink to="/admin/formularios" className={linkClasse}>Formulários</NavLink>
                </>
              )}
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
          {NOME_APP} — Projeto acadêmico
        </footer>
      </div>
    </div>
  );
}
