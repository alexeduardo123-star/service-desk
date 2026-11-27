import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    usuario: { id: 1, nome: "Ana", papel: "TECNICO", permissoes: ["agenda.ver"] },
    logout: vi.fn(),
    atualizarUsuario: vi.fn(),
  }),
}));
vi.mock("../services/configuracaoService", () => ({ default: { obter: vi.fn().mockResolvedValue({}) } }));
vi.mock("../services/permissaoService", () => ({ default: { minhas: vi.fn().mockResolvedValue({ permissoes: ["agenda.ver"] }) } }));
vi.mock("../services/notificacaoService", () => ({
  EVENTO_NOTIFICACOES: "notificacoes:atualizadas",
  default: { contarNaoLidas: vi.fn() },
}));

const notificacaoService = (await import("../services/notificacaoService")).default;
const { default: AppLayout } = await import("./AppLayout");

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<p>Página inicial</p>} />
          <Route path="/tickets" element={<p>Lista de chamados</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  notificacaoService.contarNaoLidas.mockResolvedValue(0);
});

describe("AppLayout: menu no celular", () => {
  it("o botão do menu começa fechado e abre a gaveta com a navegação", () => {
    renderizar();
    const botao = screen.getByRole("button", { name: "Abrir menu" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    // Só o menu lateral do desktop (escondido por CSS no celular).
    expect(screen.getAllByRole("navigation", { name: "Menu principal" })).toHaveLength(1);

    fireEvent.click(botao);

    expect(botao).toHaveAttribute("aria-expanded", "true");
    const menus = screen.getAllByRole("navigation", { name: "Menu principal" });
    expect(menus).toHaveLength(2);
    expect(menus[1]).toHaveAttribute("id", "menu-principal");
    expect(within(menus[1]).getByRole("link", { name: "Dashboard" })).toHaveFocus();
  });

  it("Esc fecha a gaveta e devolve o foco ao botão do menu", () => {
    renderizar();
    const botao = screen.getByRole("button", { name: "Abrir menu" });
    botao.focus();
    fireEvent.click(botao);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getAllByRole("navigation", { name: "Menu principal" })).toHaveLength(1);
    expect(botao).toHaveFocus();
  });

  it("o botão Fechar menu também fecha", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));

    expect(screen.queryByRole("button", { name: "Fechar menu" })).not.toBeInTheDocument();
  });

  it("escolher uma tela navega e fecha a gaveta", async () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    const gaveta = screen.getAllByRole("navigation", { name: "Menu principal" })[1];

    fireEvent.click(within(gaveta).getByRole("link", { name: "Chamados" }));

    expect(await screen.findByText("Lista de chamados")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Menu principal" })).toHaveLength(1);
  });

  it("mostra só as telas que o perfil pode ver", () => {
    renderizar();
    const menu = screen.getByRole("navigation", { name: "Menu principal" });
    expect(within(menu).getByRole("link", { name: "Agenda" })).toBeInTheDocument();
    expect(within(menu).queryByRole("link", { name: "Relatórios" })).not.toBeInTheDocument();
  });
});

describe("AppLayout: acessibilidade geral", () => {
  it("tem atalho para pular direto ao conteúdo", () => {
    renderizar();
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute("href", "#conteudo");
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
  });

  it("o sino anuncia as notificações não lidas", async () => {
    notificacaoService.contarNaoLidas.mockResolvedValue(3);
    renderizar();

    await waitFor(() => expect(screen.getByText("3 notificações não lidas")).toBeInTheDocument());
    expect(screen.getByText("3 notificações não lidas")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("link", { name: "Notificações (3 não lidas)" })).toBeInTheDocument();
  });
});
