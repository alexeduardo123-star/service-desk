import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const ticketService = (await import("../services/ticketService")).default;
const categoriaService = (await import("../services/categoriaService")).default;
const prioridadeService = (await import("../services/prioridadeService")).default;
const equipamentoService = (await import("../services/equipamentoService")).default;
const departamentoService = (await import("../services/departamentoService")).default;
const usuarioService = (await import("../services/usuarioService")).default;
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
  ticketService.criar.mockResolvedValue({ id: 99 });
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
