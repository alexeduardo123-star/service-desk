import { useEffect, useMemo, useState } from "react";
import permissaoService from "../services/permissaoService";
import { PAPEL_LABEL } from "../constants/labels";
import Botao from "../components/Botao";
import Toggle from "../components/Toggle";
import { useNotification } from "../store/useNotification";

const PAPEL_NOME = { ADMIN: "Administrador", GESTOR: "Gestor", TECNICO: "Técnico", SOLICITANTE: "Solicitante" };

export default function PerfisPermissoes() {
  const [dados, setDados] = useState(null);
  const [papel, setPapel] = useState("GESTOR");
  const [selecionadas, setSelecionadas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const { notificar } = useNotification();

  useEffect(() => {
    permissaoService.listar()
      .then((resposta) => {
        setDados(resposta);
        setSelecionadas(resposta.permissoesPorPapel[papel] || []);
      })
      .catch(() => notificar("Não foi possível carregar as permissões", "erro"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grupos = useMemo(() => {
    if (!dados) return [];
    return Object.entries(dados.permissoes.reduce((acc, permissao) => {
      (acc[permissao.grupo] ||= []).push(permissao);
      return acc;
    }, {}));
  }, [dados]);

  function trocarPapel(novoPapel) {
    setPapel(novoPapel);
    setSelecionadas(dados?.permissoesPorPapel[novoPapel] || []);
  }

  function alternar(chave, ativo) {
    setSelecionadas((atuais) => ativo ? [...atuais, chave] : atuais.filter((item) => item !== chave));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resposta = await permissaoService.atualizarPerfil(papel, selecionadas);
      setDados((atual) => ({ ...atual, permissoesPorPapel: { ...atual.permissoesPorPapel, [papel]: resposta.permissoes } }));
      notificar(`Permissões do perfil ${PAPEL_NOME[papel]} atualizadas`);
    } catch (erro) {
      notificar(erro.response?.data?.erro || "Erro ao salvar permissões", "erro");
    } finally {
      setSalvando(false);
    }
  }

  if (!dados) return <p className="text-sm text-gray-500">Carregando perfis e permissões…</p>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Perfis e permissões</h1>
        <p className="mt-1 text-sm text-gray-500">Escolha um perfil para consultar e definir quais recursos seus usuários podem acessar.</p>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="perfil-acesso" className="mb-2 block text-sm font-medium text-gray-700">Perfil de acesso</label>
        <select id="perfil-acesso" value={papel} onChange={(e) => trocarPapel(e.target.value)} className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          {dados.papeis.map((item) => <option key={item} value={item}>{PAPEL_NOME[item] || PAPEL_LABEL[item] || item}</option>)}
        </select>
        {papel === "ADMIN" && <p className="mt-3 text-sm text-gray-500">O Administrador possui acesso completo e suas permissões não podem ser restringidas por esta tela.</p>}
      </section>

      <div className="space-y-4">
        {grupos.map(([grupo, permissoes]) => (
          <section key={grupo} className="rounded-lg border border-gray-200 bg-white px-4">
            <h2 className="border-b border-gray-100 py-3 text-sm font-semibold text-gray-900">{grupo}</h2>
            {permissoes.map((permissao) => (
              <Toggle
                key={permissao.chave}
                label={permissao.nome}
                descricao={permissao.descricao}
                checked={papel === "ADMIN" || selecionadas.includes(permissao.chave)}
                disabled={papel === "ADMIN"}
                onChange={(ativo) => alternar(permissao.chave, ativo)}
              />
            ))}
          </section>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-gray-500">As alterações passam a valer imediatamente para os usuários do perfil.</p>
        <Botao onClick={salvar} disabled={salvando || papel === "ADMIN"}>{salvando ? "Salvando…" : "Salvar permissões"}</Botao>
      </div>
    </div>
  );
}
