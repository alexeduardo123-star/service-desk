import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const notificar = vi.fn();

vi.mock("../store/useNotification", () => ({ useNotification: () => ({ notificar }) }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ usuario: { id: 30, nome: "Carla", papel: "TECNICO", permissoes: [] } }),
}));
vi.mock("../services/notificacaoService", () => ({
  default: { listar: vi.fn(), marcarLida: vi.fn(), marcarTodasLidas: vi.fn(), excluir: vi.fn(), excluirLidas: vi.fn() },
}));
vi.mock("../services/usuarioService", () => ({ default: { listar: vi.fn().mockResolvedValue([]) } }));

const notificacaoService = (await import("../services/notificacaoService")).default;
const { default: Notificacoes } = await import("./Notificacoes");

const ENCAMINHADA = {
  id: 1,
  tipo: "TICKET_ENCAMINHADO",
  titulo: "Chamado #7 encaminhado para você",
  mensagem: 'Admin encaminhou "VPN" para você. Motivo: especialista em rede',
  ticketId: 7,
  lida: false,
  createdAt: "2026-11-27T10:00:00Z",
};
const COLABORADOR = {
  id: 2,
  tipo: "TICKET_COLABORADOR",
  titulo: "Você foi adicionado ao chamado #8",
  mensagem: 'Téc adicionou você como colaborador em "Impressora".',
  ticketId: 8,
  lida: false,
  createdAt: "2026-11-27T09:00:00Z",
};
const COMUNICADO = {
  id: 3,
  tipo: "SISTEMA",
  titulo: "Manutenção sábado",
  mensagem: "O sistema fica fora do ar das 8h às 10h.",
  ticketId: null,
  lida: false,
  createdAt: "2026-11-27T08:00:00Z",
};

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/notificacoes"]}>
      <Routes>
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/tickets/:id" element={<p>Página do chamado</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  notificacaoService.listar.mockResolvedValue([ENCAMINHADA, COLABORADOR, COMUNICADO]);
  notificacaoService.marcarLida.mockResolvedValue({});
});

describe("Notificacoes: tipos de chamado novos", () => {
  it("mostra o rótulo de encaminhamento e de colaboração", async () => {
    renderizar();

    const encaminhada = (await screen.findByText("Chamado #7 encaminhado para você")).closest("li");
    expect(within(encaminhada).getByText("Encaminhamento")).toBeInTheDocument();
    const colaboracao = screen.getByText("Você foi adicionado ao chamado #8").closest("li");
    expect(within(colaboracao).getByText("Colaboração")).toBeInTheDocument();
  });

  it("o filtro por tipo oferece os tipos novos", async () => {
    renderizar();
    const filtro = await screen.findByRole("combobox", { name: "Filtrar por tipo" });

    const opcoes = within(filtro).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(expect.arrayContaining(["Encaminhamento", "Colaboração"]));
  });

  it("clicar no título abre o chamado e marca como lida", async () => {
    renderizar();

    fireEvent.click(await screen.findByRole("link", { name: "Chamado #7 encaminhado para você" }));

    expect(await screen.findByText("Página do chamado")).toBeInTheDocument();
    expect(notificacaoService.marcarLida).toHaveBeenCalledWith(1, true);
  });

  it("'Ver chamado' também abre o chamado e marca como lida", async () => {
    renderizar();
    const colaboracao = (await screen.findByText("Você foi adicionado ao chamado #8")).closest("li");

    fireEvent.click(within(colaboracao).getByRole("link", { name: "Ver chamado" }));

    expect(await screen.findByText("Página do chamado")).toBeInTheDocument();
    expect(notificacaoService.marcarLida).toHaveBeenCalledWith(2, true);
  });

  it("notificação já lida abre o chamado sem chamar a API de novo", async () => {
    notificacaoService.listar.mockResolvedValue([{ ...ENCAMINHADA, lida: true }]);
    renderizar();

    fireEvent.click(await screen.findByRole("link", { name: "Chamado #7 encaminhado para você" }));

    expect(await screen.findByText("Página do chamado")).toBeInTheDocument();
    expect(notificacaoService.marcarLida).not.toHaveBeenCalled();
  });

  it("se marcar como lida falhar, o chamado abre mesmo assim", async () => {
    notificacaoService.marcarLida.mockRejectedValue(new Error("falhou"));
    renderizar();

    fireEvent.click(await screen.findByRole("link", { name: "Chamado #7 encaminhado para você" }));

    expect(await screen.findByText("Página do chamado")).toBeInTheDocument();
    await waitFor(() => expect(notificacaoService.marcarLida).toHaveBeenCalled());
    expect(notificar).not.toHaveBeenCalled();
  });

  it("comunicado sem chamado não vira link", async () => {
    renderizar();

    expect(await screen.findByText("Manutenção sábado")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Manutenção sábado" })).not.toBeInTheDocument();
  });
});
