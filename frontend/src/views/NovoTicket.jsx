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
import SelectField from "../components/SelectField";
import TextAreaField from "../components/TextAreaField";
import CabecalhoPagina from "../components/CabecalhoPagina";
import Botao from "../components/Botao";
import { useNotification } from "../store/useNotification";
import { setorInicial } from "../utils/setor";
import FormularioPreenchimento from "../components/FormularioPreenchimento";
import SugestoesArtigos from "../components/SugestoesArtigos";
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
  // O assunto não tem categoria; o serviço e o nome dele entram no texto da sugestão.
  const assuntoEscolhido = assuntos.find((a) => String(a.id) === String(assuntoId));
  const textoDoAssunto = assuntoEscolhido ? `${assuntoEscolhido.servico?.nome ?? ""} ${assuntoEscolhido.nome}` : "";

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
      <CabecalhoPagina titulo="Novo chamado" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <InputField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <TextAreaField label="Descrição" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} required />

        <SugestoesArtigos textoDigitado={`${titulo} ${descricao}`} textoExtra={textoDoAssunto} categoriaId={categoriaId} />

        {assuntos.length > 0 && (
          <SelectField
            label="Assunto"
            placeholder="Selecione…"
            value={assuntoId}
            onChange={(e) => escolherAssunto(e.target.value)}
            options={opcoesAssunto(assuntos)}
          />
        )}

        <FormularioPreenchimento
          campos={camposFormulario}
          valores={respostas}
          onChange={(campoId, valor) => setRespostas((atual) => ({ ...atual, [campoId]: valor }))}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Categoria"
            placeholder="Selecione…"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
            required
          />

          <SelectField
            label="Prioridade"
            placeholder="Selecione…"
            value={prioridadeId}
            onChange={(e) => setPrioridadeId(e.target.value)}
            disabled={prioridadeDefinidaPeloAssunto}
            ajuda={prioridadeDefinidaPeloAssunto ? "Definida pelo assunto escolhido." : undefined}
            options={prioridades.map((p) => ({ value: p.id, label: p.nome }))}
            required
          />

          <SelectField
            label="Setor"
            placeholder="Selecione…"
            value={departamentoId}
            onChange={(e) => setDepartamentoId(e.target.value)}
            ajuda={usuarioSemSetor ? "Seu usuário não tem setor cadastrado: escolha o setor do chamado." : undefined}
            options={departamentos.map((d) => ({ value: d.id, label: d.nome }))}
            required
          />

          <SelectField
            label="Equipamento (opcional)"
            placeholder="Nenhum"
            value={equipamentoId}
            onChange={(e) => setEquipamentoId(e.target.value)}
            options={equipamentos.map((eq) => ({ value: eq.id, label: `${eq.nome} (${eq.numeroSerie})` }))}
          />
        </div>

        <Botao type="submit" disabled={enviando} className="sm:self-start">
          {enviando ? "Enviando…" : "Abrir chamado"}
        </Botao>
      </form>
    </div>
  );
}
