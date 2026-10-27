import { useEffect, useState } from "react";
import Botao from "../components/Botao";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Toggle from "../components/Toggle";
import { useAuth } from "../auth/useAuth";
import { useNotification } from "../store/useNotification";
import usuarioService from "../services/usuarioService";
import configuracaoService from "../services/configuracaoService";
import { PAPEL_LABEL } from "../constants/labels";
import { formatarTelefone } from "../utils/formatTelefone";
import { formatDate } from "../utils/formatDate";
import { salvarPreferencias } from "../utils/preferencias";

const ABAS = [
  { id: "perfil", label: "Perfil" },
  { id: "notificacoes", label: "Notificações" },
  { id: "preferencias", label: "Preferências" },
  { id: "seguranca", label: "Segurança" },
];

const OPCOES_NOTIFICACAO = [
  { name: "notificarNovoTicket", label: "Novos chamados", descricao: "Aviso quando um chamado for aberto (técnicos e administradores)." },
  { name: "notificarAtribuicao", label: "Atribuições", descricao: "Aviso quando um chamado for atribuído a você ou ao seu técnico." },
  { name: "notificarStatus", label: "Mudanças de status", descricao: "Aviso quando um chamado seu mudar de status." },
  { name: "notificarComentario", label: "Novos comentários", descricao: "Aviso quando alguém comentar em um chamado seu." },
  { name: "notificarEmail", label: "Receber também por email", descricao: "Envia uma cópia de cada aviso para o seu email cadastrado." },
];

const ITENS_POR_PAGINA = [5, 10, 20, 50].map((n) => ({ value: n, label: `${n} por página` }));

const FUSOS = [
  { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
  { value: "America/Manaus", label: "Manaus (UTC-4)" },
  { value: "America/Belem", label: "Belém (UTC-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (UTC-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (UTC-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
  { value: "UTC", label: "UTC" },
];

function Secao({ titulo, descricao, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
      {descricao && <p className="mb-4 text-sm text-gray-500">{descricao}</p>}
      {children}
    </section>
  );
}

function InfoLinha({ rotulo, valor }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-400">{rotulo}</dt>
      <dd className="text-sm text-gray-800">{valor || "-"}</dd>
    </div>
  );
}

export default function Configuracoes() {
  const { atualizarUsuario } = useAuth();
  const { notificar } = useNotification();
  const [aba, setAba] = useState("perfil");
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({ nome: "", telefone: "", cargo: "" });
  const [config, setConfig] = useState(null);
  const [senhas, setSenhas] = useState({ senhaAtual: "", novaSenha: "", confirmacao: "" });
  const [errosSenha, setErrosSenha] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([usuarioService.me(), configuracaoService.obter()])
      .then(([me, cfg]) => {
        if (!ativo) return;
        setPerfil(me);
        setForm({ nome: me.nome, telefone: formatarTelefone(me.telefone), cargo: me.cargo ?? "" });
        setConfig(cfg);
      })
      .catch(() => notificar("Erro ao carregar suas configurações", "erro"));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarPerfil(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const atualizado = await usuarioService.atualizarPerfil(form);
      setPerfil(atualizado);
      atualizarUsuario({ nome: atualizado.nome });
      notificar("Perfil atualizado com sucesso");
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar o perfil", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarConfig(campos, mensagem) {
    setSalvando(true);
    try {
      const atualizada = await configuracaoService.atualizar(campos);
      setConfig(atualizada);
      salvarPreferencias(atualizada);
      notificar(mensagem);
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao salvar as configurações", "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function restaurarPadrao() {
    if (!confirm("Restaurar todas as preferências e notificações para o padrão?")) return;
    try {
      const padrao = await configuracaoService.restaurarPadrao();
      setConfig(padrao);
      salvarPreferencias(padrao);
      notificar("Configurações restauradas para o padrão");
    } catch {
      notificar("Erro ao restaurar as configurações", "erro");
    }
  }

  async function alterarSenha(e) {
    e.preventDefault();
    const erros = {};
    if (!senhas.senhaAtual) erros.senhaAtual = "Informe a senha atual";
    if (senhas.novaSenha.length < 6) erros.novaSenha = "A nova senha deve ter ao menos 6 caracteres";
    else if (senhas.novaSenha === senhas.senhaAtual) erros.novaSenha = "A nova senha deve ser diferente da atual";
    if (senhas.confirmacao !== senhas.novaSenha) erros.confirmacao = "As senhas não conferem";
    setErrosSenha(erros);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    try {
      await usuarioService.alterarSenha(senhas.senhaAtual, senhas.novaSenha);
      setSenhas({ senhaAtual: "", novaSenha: "", confirmacao: "" });
      notificar("Senha alterada com sucesso");
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao alterar a senha", "erro");
    } finally {
      setSalvando(false);
    }
  }

  if (!perfil || !config) return <p className="text-sm text-gray-500">Carregando…</p>;

  const agoraNoFuso = new Date().toLocaleString("pt-BR", { timeZone: config.fusoHorario });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Configurações</h1>
      <p className="mb-6 text-sm text-gray-500">Gerencie seu perfil, suas notificações e as preferências da conta.</p>

      <div className="mb-6 flex gap-1 border-b border-gray-200" role="tablist">
        {ABAS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => setAba(item.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              aba === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {aba === "perfil" && (
        <div className="flex flex-col gap-4">
          <Secao titulo="Dados pessoais" descricao="Essas informações aparecem para os técnicos nos seus chamados.">
            <form onSubmit={salvarPerfil} className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="Nome"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <InputField label="Email" value={perfil.email} disabled className="bg-gray-100 text-gray-500" />
              <InputField
                label="Telefone"
                placeholder="(49) 99999-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
              />
              <InputField
                label="Cargo"
                placeholder="Ex.: Analista financeiro"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Botao type="submit" disabled={salvando}>
                  Salvar perfil
                </Botao>
              </div>
            </form>
          </Secao>

          <Secao titulo="Informações da conta" descricao="Somente um administrador pode alterar estes dados.">
            <dl className="grid gap-3 sm:grid-cols-3">
              <InfoLinha rotulo="Perfil de acesso" valor={PAPEL_LABEL[perfil.papel]} />
              <InfoLinha rotulo="Departamento" valor={perfil.departamento?.nome} />
              <InfoLinha rotulo="Membro desde" valor={formatDate(perfil.createdAt)} />
            </dl>
          </Secao>
        </div>
      )}

      {aba === "notificacoes" && (
        <Secao titulo="Quais avisos você quer receber?" descricao="Os avisos sempre aparecem na central de notificações; aqui você escolhe quais são gerados.">
          <div className="divide-y divide-gray-100">
            {OPCOES_NOTIFICACAO.map((op) => (
              <Toggle
                key={op.name}
                label={op.label}
                descricao={op.descricao}
                checked={config[op.name]}
                onChange={(valor) => setConfig({ ...config, [op.name]: valor })}
              />
            ))}
          </div>
          <div className="mt-4">
            <Botao
              disabled={salvando}
              onClick={() =>
                salvarConfig(
                  Object.fromEntries(OPCOES_NOTIFICACAO.map((op) => [op.name, config[op.name]])),
                  "Preferências de notificação salvas"
                )
              }
            >
              Salvar notificações
            </Botao>
          </div>
        </Secao>
      )}

      {aba === "preferencias" && (
        <Secao titulo="Exibição" descricao="Ajusta como as listas e as datas aparecem para você.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Itens por página"
              value={config.itensPorPagina}
              onChange={(e) => setConfig({ ...config, itensPorPagina: Number(e.target.value) })}
              options={ITENS_POR_PAGINA}
            />
            <SelectField
              label="Fuso horário"
              value={config.fusoHorario}
              onChange={(e) => setConfig({ ...config, fusoHorario: e.target.value })}
              options={FUSOS}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Agora neste fuso: {agoraNoFuso}</p>
          <div className="mt-4 flex gap-2">
            <Botao
              disabled={salvando}
              onClick={() =>
                salvarConfig(
                  { itensPorPagina: config.itensPorPagina, fusoHorario: config.fusoHorario },
                  "Preferências salvas"
                )
              }
            >
              Salvar preferências
            </Botao>
            <Botao variante="secundario" onClick={restaurarPadrao}>
              Restaurar padrão
            </Botao>
          </div>
        </Secao>
      )}

      {aba === "seguranca" && (
        <Secao titulo="Alterar senha" descricao="Use uma senha com pelo menos 6 caracteres.">
          <form onSubmit={alterarSenha} className="grid max-w-md gap-3">
            <InputField
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              value={senhas.senhaAtual}
              error={errosSenha.senhaAtual}
              onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })}
            />
            <InputField
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              value={senhas.novaSenha}
              error={errosSenha.novaSenha}
              onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })}
            />
            <InputField
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              value={senhas.confirmacao}
              error={errosSenha.confirmacao}
              onChange={(e) => setSenhas({ ...senhas, confirmacao: e.target.value })}
            />
            <div>
              <Botao type="submit" disabled={salvando}>
                Alterar senha
              </Botao>
            </div>
          </form>
        </Secao>
      )}
    </div>
  );
}
