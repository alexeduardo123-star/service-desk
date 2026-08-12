import { createContext, useContext, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext();

function usuarioSalvo() {
  const raw = localStorage.getItem("usuario");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioSalvo);
  const [token, setToken] = useState(localStorage.getItem("token"));

  async function login(email, senha) {
    const data = await authService.login(email, senha);
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
  }

  const logado = Boolean(token);

  return (
    <AuthContext.Provider value={{ logado, usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
