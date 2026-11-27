import { useEffect, useRef, useState } from "react";
import baseConhecimentoService from "../services/baseConhecimentoService";
import { useDebounce } from "../hooks/useDebounce";
import categoriaService from "../services/categoriaService";
import Botao from "../components/Botao";
import CabecalhoPagina from "../components/CabecalhoPagina";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import TextAreaField from "../components/TextAreaField";
import { Carregando, ErroCarregar, Vazio } from "../components/Estados";
import { useAuth } from "../auth/useAuth";
import { temPermissao } from "../utils/permissoes";
import { formatDate } from "../utils/formatDate";
import { useNotification } from "../store/useNotification";

export default function BaseConhecimento() {
  const [artigos, setArtigos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const { usuario } = useAuth();
  const { notificar } = useNotification();
  const podeEscrever = temPermissao(usuario, "base.gerenciar");
  const buscaAtrasada = useDebounce(busca.trim(), 300);
  const filtrando = Boolean(buscaAtrasada || categoriaFiltro);
  // Numera as buscas: se a pessoa digita rápido, uma resposta antiga que chegue
  // depois não sobrescreve a lista da busca mais nova.
  const ultimaBusca = useRef(0);

  async function carregar() {
    const numero = ++ultimaBusca.current;
    setCarregando(true);
    try {
      const lista = await baseConhecimentoService.listar({ q: buscaAtrasada, categoriaId: categoriaFiltro });
      if (numero === ultimaBusca.current) {
        setArtigos(lista);
        setFalhou(false);
      }
    } catch {
      if (numero === ultimaBusca.current) {
        setFalhou(true);
        notificar("Erro ao carregar os artigos", "erro");
      }
    } finally {
      if (numero === ultimaBusca.current) setCarregando(false);
    }
  }

  useEffect(() => {
    categoriaService.listar().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    // Agendada como microtask para não disparar setState de forma síncrona
    // dentro do corpo do efeito (react-hooks/set-state-in-effect).
    Promise.resolve().then(carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAtrasada, categoriaFiltro]);

  async function salvar(e) {
    e.preventDefault();
    try {
      await baseConhecimentoService.criar({
        ...form,
        categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
      });
      notificar("Artigo publicado");
      setForm(null);
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao publicar", "erro");
    }
  }

  async function excluir(id) {
    if (!confirm("Excluir este artigo?")) return;
    try {
      await baseConhecimentoService.excluir(id);
      notificar("Artigo excluído");
      carregar();
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao excluir o artigo", "erro");
    }
  }

  return (
    <div>
      <CabecalhoPagina titulo="Base de Conhecimento">
        {podeEscrever && !form && (
          <Botao type="button" onClick={() => setForm({ titulo: "", conteudo: "", categoriaId: "" })}>Novo artigo</Botao>
        )}
      </CabecalhoPagina>

      {form && (
        <form onSubmit={salvar} className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <InputField label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <TextAreaField
            label="Conteúdo"
            rows={4}
            value={form.conteudo}
            onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
            required
          />
          <SelectField
            label="Categoria (opcional)"
            placeholder="Nenhuma"
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
          <div className="flex flex-wrap gap-2">
            <Botao type="submit">Publicar</Botao>
            <Botao type="button" variante="secundario" onClick={() => setForm(null)}>Cancelar</Botao>
          </div>
        </form>
      )}

      <div role="search" aria-label="Buscar artigos" className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <InputField
            label="Buscar"
            type="search"
            placeholder="Título ou conteúdo do artigo"
            maxLength={100}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <SelectField
            label="Filtrar por categoria"
            placeholder="Todas"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
        </div>
      </div>

      {carregando ? (
        <Carregando />
      ) : falhou ? (
        <ErroCarregar texto="Não foi possível carregar os artigos." onTentarDeNovo={carregar} />
      ) : (
        <div className="flex flex-col gap-3">
          {artigos.map((artigo) => (
            <article key={artigo.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-gray-900">{artigo.titulo}</h2>
                {podeEscrever && (
                  <Botao
                    type="button"
                    variante="linkPerigo"
                    className="shrink-0 text-xs"
                    aria-label={`Excluir o artigo ${artigo.titulo}`}
                    onClick={() => excluir(artigo.id)}
                  >
                    Excluir
                  </Botao>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{artigo.conteudo}</p>
              <p className="mt-2 text-xs text-gray-500">
                {artigo.categoria?.nome && `${artigo.categoria.nome} · `}
                por {artigo.autor?.nome} em {formatDate(artigo.createdAt)}
              </p>
            </article>
          ))}
          {artigos.length === 0 && <Vazio texto={filtrando ? "Nenhum artigo encontrado." : "Nenhum artigo publicado ainda."} />}
        </div>
      )}
    </div>
  );
}
