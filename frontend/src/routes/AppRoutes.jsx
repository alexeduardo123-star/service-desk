import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { temPermissao } from "../utils/permissoes";
import AppLayout from "../layouts/AppLayout";

import Login from "../views/Login";
import Cadastro from "../views/Cadastro";
import EsqueciSenha from "../views/EsqueciSenha";
import Home from "../views/Home";
import Tickets from "../views/Tickets";
import NovoTicket from "../views/NovoTicket";
import TicketDetalhe from "../views/TicketDetalhe";
import BaseConhecimento from "../views/BaseConhecimento";
import Usuarios from "../views/Usuarios";
import Departamentos from "../views/Departamentos";
import Categorias from "../views/Categorias";
import Prioridades from "../views/Prioridades";
import Equipamentos from "../views/Equipamentos";
import Contratos from "../views/Contratos";
import Fornecedores from "../views/Fornecedores";
import Agenda from "../views/Agenda";
import Servicos from "../views/Servicos";
import Assuntos from "../views/Assuntos";
import Formularios from "../views/Formularios";
import Configuracoes from "../views/Configuracoes";
import Notificacoes from "../views/Notificacoes";
import Kanban from "../views/Kanban";
import Relatorios from "../views/Relatorios";
import PerfisPermissoes from "../views/PerfisPermissoes";

// permissao: chave de permissão exigida (ver backend/src/utils/permissoes.js).
function RotaPrivada({ children, permissao }) {
  const { logado, usuario } = useAuth();
  if (!logado) return <Navigate to="/" />;
  if (permissao && !temPermissao(usuario, permissao)) return <Navigate to="/home" />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />

      <Route
        element={
          <RotaPrivada>
            <AppLayout />
          </RotaPrivada>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/tickets/novo" element={<NovoTicket />} />
        <Route path="/tickets/:id" element={<TicketDetalhe />} />
        <Route path="/kb" element={<BaseConhecimento />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/notificacoes" element={<Notificacoes />} />

        <Route
          path="/agenda"
          element={
            <RotaPrivada permissao="agenda.ver">
              <Agenda />
            </RotaPrivada>
          }
        />
        <Route
          path="/relatorios"
          element={
            <RotaPrivada permissao="relatorios.ver">
              <Relatorios />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/equipamentos"
          element={
            <RotaPrivada permissao="equipamentos.gerenciar">
              <Equipamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/fornecedores"
          element={
            <RotaPrivada permissao="fornecedores.ver">
              <Fornecedores />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/contratos"
          element={
            <RotaPrivada permissao="contratos.ver">
              <Contratos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RotaPrivada permissao="usuarios.gerenciar">
              <Usuarios />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/perfis"
          element={
            <RotaPrivada permissao="permissoes.gerenciar">
              <PerfisPermissoes />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/departamentos"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Departamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Categorias />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/prioridades"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Prioridades />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/servicos"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Servicos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/assuntos"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Assuntos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/formularios"
          element={
            <RotaPrivada permissao="cadastros.gerenciar">
              <Formularios />
            </RotaPrivada>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
