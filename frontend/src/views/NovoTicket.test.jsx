import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const notificar = vi.fn();
const navigate = vi.fn();

vi.mock("../store/useNotification", () => ({
  useNotification: () => ({ notificar }),
}));

vi.mock("react-router-dom", async (original) => ({
  ...(await original()),
  useNavigate: () => navigate,
}));

vi.mock("../services/ticketService", () => ({ default: { criar: vi.fn() } }));
vi.mock("../services/categoriaService", () => ({ default: { listar: vi.fn() } }));
vi.mock("../services/prioridadeService", () => ({ default: { listar: vi.fn() } }));
vi.mock("../services/equipamentoService", () => ({ default: { listar: vi.fn() } }));
vi.mock("../services/departamentoService", () => ({ default: { listar: vi.fn() } }));
vi.mock("../services/usuarioService", () => ({ default: { me: vi.fn() } }));
vi.mock("../services/assuntoService", () => ({ default: { listar: vi.fn(), buscar: vi.fn() } }));
vi.mock("../services/baseConhecimentoService", () => ({ default: { sugestoes: vi.fn(), buscar: vi.fn() } }));

const ticketService = (await import("../services/ticketService")).default;
const categoriaService = (await import("../services/categoriaService")).default;
const prioridadeService = (await import("../services/prioridadeService")).default;
const equipamentoService = (await import("../services/equipamentoService")).default;
const departamentoService = (await import("../services/departamentoService")).default;
const usuarioService = (await import("../services/usuarioService")).default;
const assuntoService = (await import("../services/assuntoService")).default;
const baseConhecimentoService = (await import("../services/baseConhecimentoService")).default;
const { default: NovoTicket } = await import("./NovoTicket");

const SETORES = [
  { id: 1, nome: "TI" },
  { id: 2, nome: "Financeiro" },
];

function renderizar() {
  return render(
    <MemoryRouter>
      <NovoTicket />
    </MemoryRouter>
  );
}

const campoSetor = () => screen.getByRole("combobox", { name: /Setor/ });

function preencherObrigatorios() {
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Impressora" } });
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Não imprime" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), { target: { value: "5" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Prioridade" }), { target: { value: "6" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  categoriaService.listar.mockResolvedValue([{ id: 5, nome: "Hardware" }]);
  prioridadeService.listar.mockResolvedValue([{ id: 6, nome: "Média" }]);
  equipamentoService.listar.mockResolvedValue([]);
  departamentoService.listar.mockResolvedValue(SETORES);
  assuntoService.listar.mockResolvedValue([]);
  ticketService.criar.mockResolvedValue({ id: 99 });
  baseConhecimentoService.sugestoes.mockResolvedValue([]);
});

describe("NovoTicket: sugestões da base de conhecimento", () => {
  const SUGESTAO = { id: 3, titulo: "Impressora não imprime", trecho: "Reinicie o spooler de impressão.", categoriaId: 5 };
  const blocoSugestoes = () => screen.findByRole("region", { name: "Isso pode resolver seu problema" });

  beforeEach(() => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: 2 });
  });

  it("depois de uma pausa na digitação, busca com o título e a descrição e mostra o bloco", async () => {
    baseConhecimentoService.sugestoes.mockResolvedValue([SUGESTAO]);
    renderizar();

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Impressora" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "não imprime nada" } });
    // Ainda dentro do debounce: nada foi pedido.
    expect(baseConhecimentoService.sugestoes).not.toHaveBeenCalled();

    const bloco = await blocoSugestoes();
    expect(baseConhecimentoService.sugestoes).toHaveBeenCalledTimes(1);
    expect(baseConhecimentoService.sugestoes).toHaveBeenCalledWith({ texto: "Impressora não imprime nada", categoriaId: "" });
    expect(within(bloco).getByText("Impressora não imprime")).toBeInTheDocument();
    expect(within(bloco).getByText("Reinicie o spooler de impressão.")).toBeInTheDocument();
  });

  it("ao escolher a categoria, busca de novo com ela", async () => {
    renderizar();
    await screen.findByRole("option", { name: "Hardware" });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Impressora" } });
    await waitFor(() => expect(baseConhecimentoService.sugestoes).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), { target: { value: "5" } });

    await waitFor(() => expect(baseConhecimentoService.sugestoes).toHaveBeenLastCalledWith({ texto: "Impressora", categoriaId: "5" }));
  });

  it("ao escolher o assunto, o nome dele entra na busca na hora", async () => {
    assuntoService.listar.mockResolvedValue([
      { id: 8, nome: "Novo acesso", ativo: true, prioridadeId: 7, servico: { nome: "Acessos" } },
    ]);
    assuntoService.buscar.mockResolvedValue({ id: 8, formulario: null });
    renderizar();
    await screen.findByRole("option", { name: "Acessos — Novo acesso" });

    fireEvent.change(screen.getByRole("combobox", { name: "Assunto" }), { target: { value: "8" } });

    await waitFor(() => expect(baseConhecimentoService.sugestoes).toHaveBeenCalledWith({ texto: "Acessos Novo acesso", categoriaId: "" }));
  });

  it("abre o artigo num modal sem sair do formulário", async () => {
    baseConhecimentoService.sugestoes.mockResolvedValue([SUGESTAO]);
    baseConhecimentoService.buscar.mockResolvedValue({ ...SUGESTAO, conteudo: "Passo 1: abra o painel.\nPasso 2: reinicie." });
    renderizar();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Impressora" } });

    const bloco = await blocoSugestoes();
    fireEvent.click(within(bloco).getByRole("button", { name: /Impressora não imprime/ }));

    const modal = await screen.findByRole("dialog", { name: "Impressora não imprime" });
    expect(await within(modal).findByText(/Passo 1: abra o painel/)).toBeInTheDocument();
    expect(baseConhecimentoService.buscar).toHaveBeenCalledWith(3);
    expect(ticketService.criar).not.toHaveBeenCalled();

    fireEvent.click(within(modal).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Impressora");
  });

  it("erro na sugestão é ignorado: sem aviso, sem bloco, e o chamado abre normalmente", async () => {
    baseConhecimentoService.sugestoes.mockRejectedValue(new Error("fora do ar"));
    renderizar();
    await waitFor(() => expect(campoSetor()).toHaveValue("2"));

    preencherObrigatorios();
    await waitFor(() => expect(baseConhecimentoService.sugestoes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/tickets/99");
    expect(notificar).not.toHaveBeenCalledWith(expect.anything(), "erro");
    expect(screen.queryByRole("region", { name: "Isso pode resolver seu problema" })).not.toBeInTheDocument();
  });

  it("a sugestão pendente não segura o envio do chamado", async () => {
    // Promessa que nunca resolve: a busca fica "pendurada" para sempre.
    baseConhecimentoService.sugestoes.mockReturnValue(new Promise(() => {}));
    renderizar();
    await waitFor(() => expect(campoSetor()).toHaveValue("2"));

    preencherObrigatorios();
    await waitFor(() => expect(baseConhecimentoService.sugestoes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
  });

  it("texto curto demais não dispara busca", async () => {
    renderizar();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "ab" } });

    await new Promise((r) => setTimeout(r, 500));
    expect(baseConhecimentoService.sugestoes).not.toHaveBeenCalled();
  });
});

describe("NovoTicket: setor", () => {
  it("já vem com o setor do usuário logado", async () => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: 2 });
    renderizar();

    await waitFor(() => expect(campoSetor()).toHaveValue("2"));
    expect(screen.getByRole("option", { name: "Financeiro" }).selected).toBe(true);
    expect(screen.queryByText(/não tem setor cadastrado/)).not.toBeInTheDocument();
  });

  it("permite trocar o setor e envia o escolhido", async () => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: 2 });
    renderizar();
    await waitFor(() => expect(campoSetor()).toHaveValue("2"));

    preencherObrigatorios();
    fireEvent.change(campoSetor(), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
    expect(ticketService.criar.mock.calls[0][0]).toMatchObject({ departamentoId: 1, categoriaId: 5, prioridadeId: 6 });
    expect(navigate).toHaveBeenCalledWith("/tickets/99");
  });

  it("usuário sem setor: campo vazio, obrigatório e com aviso", async () => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: null });
    renderizar();

    expect(await screen.findByText(/não tem setor cadastrado/)).toBeInTheDocument();
    expect(campoSetor()).toHaveValue("");
    expect(campoSetor()).toBeRequired();

    preencherObrigatorios();
    fireEvent.submit(screen.getByRole("button", { name: "Abrir chamado" }).closest("form"));

    expect(notificar).toHaveBeenCalledWith("Escolha o setor do chamado", "erro");
    expect(ticketService.criar).not.toHaveBeenCalled();
  });

  it("usuário sem setor consegue abrir depois de escolher", async () => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: null });
    renderizar();
    await screen.findByText(/não tem setor cadastrado/);
    await screen.findByRole("option", { name: "TI" });

    preencherObrigatorios();
    fireEvent.change(campoSetor(), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
    expect(ticketService.criar.mock.calls[0][0].departamentoId).toBe(1);
  });

  it("não sobrescreve o setor que a pessoa já escolheu se o perfil chegar depois", async () => {
    let responder;
    usuarioService.me.mockReturnValue(new Promise((r) => (responder = r)));
    renderizar();
    await screen.findByRole("option", { name: "TI" });

    fireEvent.change(campoSetor(), { target: { value: "1" } });
    responder({ id: 10, departamentoId: 2 });

    await waitFor(() => expect(usuarioService.me).toHaveBeenCalled());
    await Promise.resolve();
    expect(campoSetor()).toHaveValue("1");
  });
});

describe("NovoTicket: assunto", () => {
  const ASSUNTOS = [
    { id: 8, nome: "Novo acesso", ativo: true, servico: { nome: "Acessos" }, prioridadeId: 7 },
    { id: 9, nome: "Antigo", ativo: false, servico: { nome: "Acessos" }, prioridadeId: 6 },
  ];

  beforeEach(() => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: 2 });
    prioridadeService.listar.mockResolvedValue([
      { id: 6, nome: "Média" },
      { id: 7, nome: "Alta" },
    ]);
    assuntoService.listar.mockResolvedValue(ASSUNTOS);
    assuntoService.buscar.mockResolvedValue({ id: 8, formulario: null });
  });

  it("sem assuntos cadastrados não mostra o seletor", async () => {
    assuntoService.listar.mockResolvedValue([]);
    renderizar();

    await waitFor(() => expect(campoSetor()).toHaveValue("2"));
    expect(screen.queryByRole("combobox", { name: "Assunto" })).not.toBeInTheDocument();
  });

  it("lista só assuntos ativos", async () => {
    renderizar();

    expect(await screen.findByRole("option", { name: "Acessos — Novo acesso" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Antigo/ })).not.toBeInTheDocument();
  });

  it("ao escolher o assunto, a prioridade vem dele e o campo trava", async () => {
    renderizar();
    await screen.findByRole("option", { name: "Acessos — Novo acesso" });

    fireEvent.change(screen.getByRole("combobox", { name: "Assunto" }), { target: { value: "8" } });

    const prioridade = screen.getByRole("combobox", { name: "Prioridade" });
    expect(prioridade).toHaveValue("7");
    expect(prioridade).toBeDisabled();
  });

  it("envia o assunto escolhido ao abrir o chamado", async () => {
    renderizar();
    await screen.findByRole("option", { name: "Acessos — Novo acesso" });
    await waitFor(() => expect(campoSetor()).toHaveValue("2"));

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Acesso ERP" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Preciso do ERP" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), { target: { value: "5" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Assunto" }), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
    expect(ticketService.criar).toHaveBeenCalledWith(
      expect.objectContaining({ assuntoId: 8, prioridadeId: 7, departamentoId: 2 })
    );
  });
});

describe("NovoTicket: formulário do assunto", () => {
  const CAMPOS = [
    { id: 31, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] },
    { id: 32, rotulo: "Justificativa", tipo: "TEXTO_LONGO", obrigatorio: false, opcoes: [] },
  ];

  beforeEach(() => {
    usuarioService.me.mockResolvedValue({ id: 10, departamentoId: 2 });
    prioridadeService.listar.mockResolvedValue([{ id: 7, nome: "Alta" }]);
    assuntoService.listar.mockResolvedValue([
      { id: 8, nome: "Novo acesso", ativo: true, servico: { nome: "Acessos" }, prioridadeId: 7 },
    ]);
    assuntoService.buscar.mockResolvedValue({ id: 8, formulario: { ativo: true, campos: CAMPOS } });
  });

  async function escolherAssuntoComFormulario() {
    renderizar();
    await screen.findByRole("option", { name: "Acessos — Novo acesso" });
    await waitFor(() => expect(campoSetor()).toHaveValue("2"));
    fireEvent.change(screen.getByRole("combobox", { name: "Assunto" }), { target: { value: "8" } });
    await screen.findByLabelText(/Sistema/);
  }

  function preencherBasico() {
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Acesso ERP" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Preciso do ERP" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), { target: { value: "5" } });
  }

  it("mostra os campos do formulário ao escolher o assunto", async () => {
    await escolherAssuntoComFormulario();

    expect(assuntoService.buscar).toHaveBeenCalledWith("8");
    expect(screen.getByLabelText(/Justificativa/)).toBeInTheDocument();
  });

  it("não deixa abrir o chamado sem preencher o campo obrigatório", async () => {
    await escolherAssuntoComFormulario();
    preencherBasico();

    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    expect(notificar).toHaveBeenCalledWith('Preencha o campo "Sistema"', "erro");
    expect(ticketService.criar).not.toHaveBeenCalled();
  });

  it("envia as respostas junto com o chamado", async () => {
    await escolherAssuntoComFormulario();
    preencherBasico();
    fireEvent.change(screen.getByLabelText(/Sistema/), { target: { value: "ERP" } });
    fireEvent.change(screen.getByLabelText(/Justificativa/), { target: { value: "Novo cargo" } });

    fireEvent.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(ticketService.criar).toHaveBeenCalled());
    expect(ticketService.criar.mock.calls[0][0]).toMatchObject({
      assuntoId: 8,
      respostas: { 31: "ERP", 32: "Novo cargo" },
    });
  });

  it("trocar para um assunto sem formulário remove os campos", async () => {
    await escolherAssuntoComFormulario();

    assuntoService.buscar.mockResolvedValue({ id: 9, formulario: null });
    fireEvent.change(screen.getByRole("combobox", { name: "Assunto" }), { target: { value: "" } });

    await waitFor(() => expect(screen.queryByLabelText(/Sistema/)).not.toBeInTheDocument());
  });
});

