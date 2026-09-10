import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import Botao from "../components/Botao";
import InputField from "../components/InputField";

export default function EsqueciSenha() {
  const [etapa, setEtapa] = useState("solicitar"); // "solicitar" | "redefinir"
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSolicitar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);
    try {
      const data = await authService.esqueciSenha(email);
      setMensagem(data.mensagem || "Se este email estiver cadastrado, um código foi enviado.");
      setEtapa("redefinir");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível enviar o código. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleRedefinir(e) {
    e.preventDefault();
    setErro("");

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      await authService.redefinirSenha(email, codigo, novaSenha);
      navigate("/", { state: { senhaRedefinida: true } });
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Esqueci minha senha</h1>

        {etapa === "solicitar" && (
          <form onSubmit={handleSolicitar}>
            <p className="mb-6 text-sm text-gray-500">
              Informe seu email para receber um código de recuperação.
            </p>

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
              {carregando ? "Enviando…" : "Enviar código"}
            </Botao>
          </form>
        )}

        {etapa === "redefinir" && (
          <form onSubmit={handleRedefinir}>
            {mensagem && <p className="mb-4 text-sm text-green-700">{mensagem}</p>}
            <p className="mb-4 text-sm text-gray-500">
              Digite o código recebido por email e escolha sua nova senha.
            </p>

            <div className="flex flex-col gap-4">
              <InputField
                label="Código recebido por email"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={6}
                required
              />
              <InputField
                label="Nova senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={6}
                required
              />
              <InputField
                label="Confirmar nova senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
              {carregando ? "Redefinindo…" : "Redefinir senha"}
            </Botao>

            <button
              type="button"
              onClick={() => setEtapa("solicitar")}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:underline"
            >
              Não recebeu o código? Enviar novamente
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/" className="font-medium text-blue-600 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
