import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as authService from "../services/authService";
import Botao from "../components/Botao";
import InputField from "../components/InputField";

export default function Cadastro() {
  const location = useLocation();
  const [etapa, setEtapa] = useState(location.state?.verificar ? "verificar" : "cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { registrar, verificarEmail } = useAuth();
  const navigate = useNavigate();

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      const data = await registrar(nome, email, senha);
      setMensagem(data.mensagem || "Enviamos um código de confirmação para o seu email.");
      setEtapa("verificar");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleVerificar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await verificarEmail(email, codigo);
      navigate("/home");
    } catch (err) {
      setErro(err.response?.data?.erro || "Código inválido. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleReenviar() {
    setErro("");
    setMensagem("");
    try {
      const data = await authService.reenviarVerificacao(email);
      setMensagem(data.mensagem || "Código reenviado.");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível reenviar o código.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        {etapa === "cadastro" && (
          <form onSubmit={handleCadastro}>
            <h1 className="mb-1 text-xl font-bold text-gray-900">Criar conta</h1>
            <p className="mb-6 text-sm text-gray-500">
              Cadastre-se para abrir e acompanhar seus chamados
            </p>

            <div className="flex flex-col gap-4">
              <InputField
                label="Nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <InputField
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
              <InputField
                label="Confirmar senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
              {carregando ? "Criando conta…" : "Criar conta"}
            </Botao>

            <p className="mt-4 text-center text-sm text-gray-500">
              Já tem uma conta?{" "}
              <Link to="/" className="font-medium text-blue-600 hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        )}

        {etapa === "verificar" && (
          <form onSubmit={handleVerificar}>
            <h1 className="mb-1 text-xl font-bold text-gray-900">Confirme seu email</h1>
            {mensagem && <p className="mb-4 text-sm text-green-700">{mensagem}</p>}
            <p className="mb-4 text-sm text-gray-500">
              Digite o código de 6 dígitos enviado para <strong>{email}</strong>.
            </p>

            <InputField
              label="Código de confirmação"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              maxLength={6}
              required
            />

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
              {carregando ? "Confirmando…" : "Confirmar e entrar"}
            </Botao>

            <button
              type="button"
              onClick={handleReenviar}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:underline"
            >
              Não recebeu o código? Enviar novamente
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
