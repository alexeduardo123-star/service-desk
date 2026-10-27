import { useState } from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./authContext";
import { limparPreferencias } from "../utils/preferencias";

function usuarioSalvo() {
  const raw = localStorage.getItem("usuario");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioSalvo);
  const [token, setToken] = useState(localStorage.getItem("token"));

  function salvarSessao(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
  }

  async function login(email, senha) {
    const data = await authService.login(email, senha);
    salvarSessao(data);
  }

  async function registrar(nome, email, senha) {
    return authService.registrar(nome, email, senha);
  }

  async function verificarEmail(email, codigo) {
    const data = await authService.verificarEmail(email, codigo);
    salvarSessao(data);
  }

  // Atualiza os dados do usuário logado (ex.: depois de editar o perfil) sem
  // precisar fazer login de novo.
  function atualizarUsuario(dados) {
    const atualizado = { ...usuario, ...dados };
    localStorage.setItem("usuario", JSON.stringify(atualizado));
    setUsuario(atualizado);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    limparPreferencias();
    setToken(null);
    setUsuario(null);
  }

  const logado = Boolean(token);

  return (
    <AuthContext.Provider value={{ logado, usuario, token, login, registrar, verificarEmail, atualizarUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
