import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Botao from "../components/Botao";
import InputField from "../components/InputField";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      navigate("/home");
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Service Desk</h1>
        <p className="mb-6 text-sm text-gray-500">Entre com sua conta para continuar</p>

        <div className="flex flex-col gap-4">
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
            required
          />
        </div>

        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

        <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Botao>

        <p className="mt-4 text-xs text-gray-400">
          admin@servicedesk.com / tecnico@servicedesk.com / usuario@servicedesk.com — senha: 123456
        </p>
      </form>
    </div>
  );
}
