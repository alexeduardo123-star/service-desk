import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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

function RotaPrivada({ children, roles }) {
  const { logado, usuario } = useAuth();
  if (!logado) return <Navigate to="/" />;
  if (roles && !roles.includes(usuario.papel)) return <Navigate to="/home" />;
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
        <Route path="/tickets/novo" element={<NovoTicket />} />
        <Route path="/tickets/:id" element={<TicketDetalhe />} />
        <Route path="/kb" element={<BaseConhecimento />} />

        <Route
          path="/admin/equipamentos"
          element={
            <RotaPrivada roles={["ADMIN", "TECNICO"]}>
              <Equipamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RotaPrivada roles={["ADMIN"]}>
              <Usuarios />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/departamentos"
          element={
            <RotaPrivada roles={["ADMIN"]}>
              <Departamentos />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RotaPrivada roles={["ADMIN"]}>
              <Categorias />
            </RotaPrivada>
          }
        />
        <Route
          path="/admin/prioridades"
          element={
            <RotaPrivada roles={["ADMIN"]}>
              <Prioridades />
            </RotaPrivada>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
