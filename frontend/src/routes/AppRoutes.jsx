import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
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
import Servicos from "../views/Servicos";
import Assuntos from "../views/Assuntos";
import Formularios from "../views/Formularios";
import Configuracoes from "../views/Configuracoes";
import Notificacoes from "../views/Notificacoes";
import Kanban from "../views/Kanban";
import Relatorios from "../views/Relatorios";
import PerfisPermissoes from "../views/PerfisPermissoes";

function RotaPrivada({ children, permission }) {
  const { logado, usuario } = useAuth();
  if (!logado) return <Navigate to="/" />;
  const permissoes = usuario?.permissoes || [];
  if (permission && usuario?.papel !== "ADMIN" && !permissoes.includes(permission) && !permissoes.includes("*")) {
    return <Navigate to="/home" />;
  }
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
          path="/relatorios"
          element={
            <RotaPrivada permission="RELATORIOS_ACESSAR">
              <Relatorios />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/equipamentos"
          element={
            <RotaPrivada permission="EQUIPAMENTOS_ACESSAR">
              <Equipamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/contratos"
          element={
            <RotaPrivada permission="CONTRATOS_ACESSAR">
              <Contratos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RotaPrivada permission="USUARIOS_GERENCIAR">
              <Usuarios />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/departamentos"
          element={
            <RotaPrivada permission="DEPARTAMENTOS_GERENCIAR">
              <Departamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RotaPrivada permission="CATEGORIAS_GERENCIAR">
              <Categorias />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/prioridades"
          element={
            <RotaPrivada permission="PRIORIDADES_GERENCIAR">
              <Prioridades />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/servicos"
          element={
            <RotaPrivada permission="SERVICOS_GERENCIAR">
              <Servicos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/assuntos"
          element={
            <RotaPrivada permission="ASSUNTOS_GERENCIAR">
              <Assuntos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/permissoes"
          element={
            <RotaPrivada permission="PERFIS_GERENCIAR">
              <PerfisPermissoes />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/formularios"
          element={
            <RotaPrivada permission="FORMULARIOS_GERENCIAR">
              <Formularios />
            </RotaPrivada>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
