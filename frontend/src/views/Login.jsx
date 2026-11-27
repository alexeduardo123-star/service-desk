import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Botao from "../components/Botao";
import InputField from "../components/InputField";
import Logo from "../components/Logo";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function Login() {
  useTituloPagina("Entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const senhaRedefinida = location.state?.senhaRedefinida;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      navigate("/home");
    } catch (err) {
      if (err.response?.data?.emailNaoVerificado) {
        navigate("/cadastro", { state: { verificar: true, email } });
        return;
      }
      setErro(err.response?.data?.erro || "Não foi possível entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md sm:p-8">
        <h1 className="mb-1">
          <Logo tamanho={40} />
        </h1>
        <p className="mb-6 text-sm text-gray-500">Entre com sua conta para continuar</p>

        {senhaRedefinida && (
          <p role="status" className="mb-4 text-sm text-green-700">
            Senha redefinida com sucesso. Entre com sua nova senha.
          </p>
        )}

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

        {erro && <p role="alert" className="mt-3 text-sm text-red-700">{erro}</p>}

        <Botao type="submit" className="mt-6 w-full" disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Botao>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/esqueci-senha" className="text-blue-600 hover:underline">
            Esqueci minha senha
          </Link>
          <Link to="/cadastro" className="font-medium text-blue-600 hover:underline">
            Criar conta
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          admin@servicedesk.com / tecnico@servicedesk.com / usuario@servicedesk.com — senha: 123456
        </p>
      </form>
    </div>
  );
}
