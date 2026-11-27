import { useEffect, useRef, useState } from "react";
import baseConhecimentoService from "../services/baseConhecimentoService";
import { useDebounce } from "../hooks/useDebounce";
import categoriaService from "../services/categoriaService";
import Botao from "../components/Botao";
import InputField from "../components/InputField";
import { useAuth } from "../auth/useAuth";
import { temPermissao } from "../utils/permissoes";
import { formatDate } from "../utils/formatDate";
import { useNotification } from "../store/useNotification";

export default function BaseConhecimento() {
  const [artigos, setArtigos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(true);
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
      if (numero === ultimaBusca.current) setArtigos(lista);
    } catch {
      if (numero === ultimaBusca.current) notificar("Erro ao carregar os artigos", "erro");
    } finally {
      if (numero === ultimaBusca.current) setCarregando(false);
    }
  }

  useEffect(() => {
    categoriaService.listar().then(setCategorias);
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
    await baseConhecimentoService.excluir(id);
    notificar("Artigo excluído");
    carregar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Base de Conhecimento</h1>
        {podeEscrever && !form && (
          <Botao onClick={() => setForm({ titulo: "", conteudo: "", categoriaId: "" })}>Novo artigo</Botao>
        )}
      </div>

      {form && (
        <form onSubmit={salvar} className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <InputField label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="font-medium">Conteúdo</span>
            <textarea
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={4}
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="font-medium">Categoria (opcional)</span>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            >
              <option value="">Nenhuma</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Botao type="submit">Publicar</Botao>
            <Botao type="button" variante="secundario" onClick={() => setForm(null)}>Cancelar</Botao>
          </div>
        </form>
      )}

      <div role="search" className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Buscar</span>
          <input
            type="search"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Título ou conteúdo do artigo"
            maxLength={100}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700 sm:w-56">
          <span className="font-medium">Filtrar por categoria</span>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {artigos.map((artigo) => (
            <article key={artigo.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-900">{artigo.titulo}</h2>
                {podeEscrever && (
                  <button className="text-xs text-red-600 hover:underline" onClick={() => excluir(artigo.id)}>
                    Excluir
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{artigo.conteudo}</p>
              <p className="mt-2 text-xs text-gray-400">
                {artigo.categoria?.nome && `${artigo.categoria.nome} · `}
                por {artigo.autor?.nome} em {formatDate(artigo.createdAt)}
              </p>
            </article>
          ))}
          {artigos.length === 0 && (
            <p className="text-sm text-gray-400">{filtrando ? "Nenhum artigo encontrado." : "Nenhum artigo publicado ainda."}</p>
          )}
        </div>
      )}
    </div>
  );
}
