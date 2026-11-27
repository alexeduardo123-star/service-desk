import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService";
import categoriaService from "../services/categoriaService";
import prioridadeService from "../services/prioridadeService";
import equipamentoService from "../services/equipamentoService";
import departamentoService from "../services/departamentoService";
import usuarioService from "../services/usuarioService";
import assuntoService from "../services/assuntoService";
import InputField from "../components/InputField";
import Botao from "../components/Botao";
import { useNotification } from "../store/useNotification";
import { setorInicial } from "../utils/setor";
import FormularioPreenchimento from "../components/FormularioPreenchimento";
import { opcoesAssunto, prioridadeDoAssunto } from "../utils/assunto";
import { respostasIniciais, validarRespostas } from "../utils/respostasFormulario";

export default function NovoTicket() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [assuntoId, setAssuntoId] = useState("");
  const [camposFormulario, setCamposFormulario] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [prioridadeId, setPrioridadeId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [usuarioSemSetor, setUsuarioSemSetor] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [assuntos, setAssuntos] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { notificar } = useNotification();

  useEffect(() => {
    categoriaService.listar().then(setCategorias);
    prioridadeService.listar().then(setPrioridades);
    // Sem assuntos cadastrados (ou se a lista falhar) o chamado abre como antes,
    // escolhendo a prioridade na mão.
    assuntoService.listar().then(setAssuntos).catch(() => {});
    equipamentoService.listar().then(setEquipamentos);
    departamentoService.listar().then(setDepartamentos);
    // O setor vem do perfil (o usuário guardado no login não tem o setor, e ele
    // pode ter mudado depois). Só preenche se a pessoa ainda não escolheu.
    usuarioService
      .me()
      .then((perfil) => {
        const inicial = setorInicial(perfil);
        setUsuarioSemSetor(!inicial);
        setDepartamentoId((atual) => atual || inicial);
      })
      .catch(() => setUsuarioSemSetor(true));
  }, []);

  // Com assunto escolhido, a prioridade vem dele e o campo fica travado.
  const prioridadeDefinidaPeloAssunto = Boolean(prioridadeDoAssunto(assuntos, assuntoId));

  function escolherAssunto(id) {
    setAssuntoId(id);
    const daPrioridade = prioridadeDoAssunto(assuntos, id);
    if (daPrioridade) setPrioridadeId(daPrioridade);

    // O formulário do assunto (se tiver) aparece assim que ele é escolhido.
    setCamposFormulario([]);
    setRespostas({});
    if (!id) return;
    assuntoService
      .buscar(id)
      .then((assunto) => {
        const campos = assunto?.formulario?.ativo === false ? [] : (assunto?.formulario?.campos ?? []);
        setCamposFormulario(campos);
        setRespostas(respostasIniciais(campos));
      })
      .catch(() => notificar("Não foi possível carregar o formulário do assunto", "erro"));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!departamentoId) {
      notificar("Escolha o setor do chamado", "erro");
      return;
    }
    const erroFormulario = validarRespostas(camposFormulario, respostas);
    if (erroFormulario) {
      notificar(erroFormulario, "erro");
      return;
    }
    setEnviando(true);
    try {
      const ticket = await ticketService.criar({
        titulo,
        descricao,
        categoriaId: Number(categoriaId),
        prioridadeId: Number(prioridadeId),
        assuntoId: assuntoId ? Number(assuntoId) : null,
        respostas: camposFormulario.length > 0 ? respostas : undefined,
        equipamentoId: equipamentoId ? Number(equipamentoId) : null,
        departamentoId: Number(departamentoId),
      });
      notificar("Chamado aberto com sucesso");
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      notificar(err.response?.data?.erro || "Erro ao abrir chamado", "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Novo chamado</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <InputField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Descrição</span>
          <textarea
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </label>

        {assuntos.length > 0 && (
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="font-medium">Assunto</span>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={assuntoId}
              onChange={(e) => escolherAssunto(e.target.value)}
            >
              <option value="">Selecione…</option>
              {opcoesAssunto(assuntos).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        )}

        <FormularioPreenchimento
          campos={camposFormulario}
          valores={respostas}
          onChange={(campoId, valor) => setRespostas((atual) => ({ ...atual, [campoId]: valor }))}
        />

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Categoria</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
            <option value="">Selecione…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm text-gray-700">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Prioridade</span>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              value={prioridadeId}
              onChange={(e) => setPrioridadeId(e.target.value)}
              disabled={prioridadeDefinidaPeloAssunto}
              aria-describedby={prioridadeDefinidaPeloAssunto ? "ajuda-prioridade" : undefined}
              required
            >
              <option value="">Selecione…</option>
              {prioridades.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </label>
          {/* Fora do <label> para não virar parte do nome acessível do campo. */}
          {prioridadeDefinidaPeloAssunto && (
            <span id="ajuda-prioridade" className="text-xs text-gray-500">Definida pelo assunto escolhido.</span>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Setor</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)} required>
            <option value="">Selecione…</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
          {usuarioSemSetor && <span className="text-xs text-gray-500">Seu usuário não tem setor cadastrado: escolha o setor do chamado.</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Equipamento (opcional)</span>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={equipamentoId} onChange={(e) => setEquipamentoId(e.target.value)}>
            <option value="">Nenhum</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nome} ({eq.numeroSerie})</option>
            ))}
          </select>
        </label>

        <Botao type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Abrir chamado"}</Botao>
      </form>
    </div>
  );
}
