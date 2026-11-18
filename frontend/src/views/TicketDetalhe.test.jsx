import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const notificar = vi.fn();
let usuarioLogado;

vi.mock("../store/useNotification", () => ({
  useNotification: () => ({ notificar }),
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ usuario: usuarioLogado }),
}));

vi.mock("../services/ticketService", () => ({
  default: {
    buscar: vi.fn(),
    alterarStatus: vi.fn(),
    atribuir: vi.fn(),
    suspender: vi.fn(),
    retomar: vi.fn(),
  },
}));

vi.mock("../services/usuarioService", () => ({
  default: { listar: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../services/comentarioService", () => ({
  default: { criar: vi.fn() },
}));

const ticketService = (await import("../services/ticketService")).default;
const { default: TicketDetalhe } = await import("./TicketDetalhe");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const SOLICITANTE = { id: 10, nome: "Ana", papel: "SOLICITANTE" };

function chamado(extra = {}) {
  return {
    id: 7,
    titulo: "VPN não conecta",
    descricao: "Desde ontem",
    status: "EM_ANDAMENTO",
    createdAt: "2026-11-18T10:00:00Z",
    closedAt: null,
    categoria: { nome: "Rede" },
    prioridade: { nome: "Alta" },
    solicitante: { id: 10, nome: "Ana" },
    tecnico: { id: 20, nome: "Téc" },
    comentarios: [],
    ...extra,
  };
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/tickets/7"]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetalhe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  usuarioLogado = TECNICO;
});

describe("TicketDetalhe: suspender", () => {
  it("o seletor de status não oferece Suspenso", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    const select = await screen.findByRole("combobox");
    const opcoes = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).not.toContain("Suspenso");
  });

  it("exige o motivo antes de suspender", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    const confirmar = screen.getByRole("button", { name: "Confirmar suspensão" });
    expect(confirmar).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: "   " } });
    expect(confirmar).toBeDisabled();
    fireEvent.submit(confirmar.closest("form"));

    expect(notificar).toHaveBeenCalledWith("Informe o motivo da suspensão", "erro");
    expect(ticketService.suspender).not.toHaveBeenCalled();
  });

  it("suspende com o motivo informado e recarrega o chamado", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.suspender.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: " aguardando peça " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar suspensão" }));

    await waitFor(() => expect(ticketService.suspender).toHaveBeenCalledWith("7", "aguardando peça"));
    expect(notificar).toHaveBeenCalledWith("Chamado suspenso");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
  });

  it("mostra o erro da API quando a suspensão é recusada", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.suspender.mockRejectedValue({ response: { data: { erro: "O chamado já está suspenso" } } });
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: "motivo" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar suspensão" }));

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("O chamado já está suspenso", "erro"));
  });

  it("chamado fechado não oferece Suspender", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ status: "FECHADO", closedAt: "2026-11-18T12:00:00Z" }));
    renderizar();

    await screen.findByRole("combobox");
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
  });
});

describe("TicketDetalhe: retomar", () => {
  it("chamado suspenso mostra Retomar no lugar do seletor e volta para Em andamento", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    ticketService.retomar.mockResolvedValue(chamado());
    renderizar();

    const retomar = await screen.findByRole("button", { name: "Retomar" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();

    fireEvent.click(retomar);

    await waitFor(() => expect(ticketService.retomar).toHaveBeenCalledWith("7"));
    expect(notificar).toHaveBeenCalledWith("Chamado retomado");
  });
});

describe("TicketDetalhe: setor", () => {
  it("mostra o setor do chamado", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ departamento: { id: 2, nome: "Financeiro" } }));
    renderizar();

    expect(await screen.findByText("Setor: Financeiro")).toBeInTheDocument();
  });

  it("chamado antigo sem setor mostra 'Não informado'", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ departamento: null }));
    renderizar();

    expect(await screen.findByText("Setor: Não informado")).toBeInTheDocument();
  });
});

describe("TicketDetalhe: solicitante", () => {
  it("não vê as ações de suspender nem retomar", async () => {
    usuarioLogado = SOLICITANTE;
    ticketService.buscar.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    renderizar();

    expect(await screen.findByText("VPN não conecta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retomar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
  });
});
