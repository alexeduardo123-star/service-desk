import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PapelUsuario } from "../enum/PapelUsuario";
import { PAPEL_LABEL } from "../constants/labels";

const linkClasse = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

export default function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.papel === PapelUsuario.ADMIN;
  const isTecnicoOuAdmin = isAdmin || usuario?.papel === PapelUsuario.TECNICO;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <h2 className="mb-6 text-lg font-bold text-blue-600">Service Desk</h2>
        <nav className="flex flex-col gap-1">
          <NavLink to="/home" className={linkClasse}>Dashboard</NavLink>
          <NavLink to="/tickets" className={linkClasse}>Chamados</NavLink>
          <NavLink to="/kb" className={linkClasse}>Base de Conhecimento</NavLink>
          {isTecnicoOuAdmin && (
            <NavLink to="/admin/equipamentos" className={linkClasse}>Equipamentos</NavLink>
          )}
          {isAdmin && (
            <>
              <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase text-gray-400">Administração</p>
              <NavLink to="/admin/usuarios" className={linkClasse}>Usuários</NavLink>
              <NavLink to="/admin/departamentos" className={linkClasse}>Departamentos</NavLink>
              <NavLink to="/admin/categorias" className={linkClasse}>Categorias</NavLink>
              <NavLink to="/admin/prioridades" className={linkClasse}>Prioridades</NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="text-sm text-gray-600">
            {usuario?.nome} <span className="text-gray-400">— {PAPEL_LABEL[usuario?.papel]}</span>
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">
            Sair
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400">
          Service Desk — Projeto acadêmico
        </footer>
      </div>
    </div>
  );
}
