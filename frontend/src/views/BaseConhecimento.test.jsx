import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const notificar = vi.fn();

vi.mock("../store/useNotification", () => ({ useNotification: () => ({ notificar }) }));
vi.mock("../auth/useAuth", () => ({ useAuth: () => ({ usuario: { id: 1, nome: "Ana", papel: "SOLICITANTE" } }) }));
vi.mock("../services/baseConhecimentoService", () => ({ default: { listar: vi.fn(), criar: vi.fn(), excluir: vi.fn() } }));
vi.mock("../services/categoriaService", () => ({ default: { listar: vi.fn() } }));

const baseConhecimentoService = (await import("../services/baseConhecimentoService")).default;
const categoriaService = (await import("../services/categoriaService")).default;
const { default: BaseConhecimento } = await import("./BaseConhecimento");

const VPN = {
  id: 1,
  titulo: "Configurar a VPN",
  conteudo: "Abra o cliente.",
  categoria: { id: 3, nome: "Rede" },
  autor: { nome: "Téc" },
  createdAt: "2026-11-20T10:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  categoriaService.listar.mockResolvedValue([
    { id: 3, nome: "Rede" },
    { id: 5, nome: "Hardware" },
  ]);
  baseConhecimentoService.listar.mockResolvedValue([VPN]);
});

describe("BaseConhecimento: busca", () => {
  it("abre listando tudo, sem filtros", async () => {
    render(<BaseConhecimento />);

    expect(await screen.findByText("Configurar a VPN")).toBeInTheDocument();
    expect(baseConhecimentoService.listar).toHaveBeenCalledWith({ q: "", categoriaId: "" });
  });

  it("busca o texto digitado só depois de uma pausa, sem uma chamada por tecla", async () => {
    render(<BaseConhecimento />);
    await screen.findByText("Configurar a VPN");
    const campo = screen.getByRole("searchbox", { name: "Buscar" });

    fireEvent.change(campo, { target: { value: "v" } });
    fireEvent.change(campo, { target: { value: "vp" } });
    fireEvent.change(campo, { target: { value: " vpn " } });
    expect(baseConhecimentoService.listar).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(baseConhecimentoService.listar).toHaveBeenCalledTimes(2));
    expect(baseConhecimentoService.listar).toHaveBeenLastCalledWith({ q: "vpn", categoriaId: "" });
  });

  it("filtra pela categoria escolhida", async () => {
    render(<BaseConhecimento />);
    await screen.findByRole("option", { name: "Hardware" });

    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por categoria" }), { target: { value: "5" } });

    await waitFor(() => expect(baseConhecimentoService.listar).toHaveBeenLastCalledWith({ q: "", categoriaId: "5" }));
  });

  it("mostra 'Nenhum artigo encontrado' quando a busca volta vazia", async () => {
    render(<BaseConhecimento />);
    await screen.findByText("Configurar a VPN");
    baseConhecimentoService.listar.mockResolvedValue([]);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), { target: { value: "inexistente" } });

    expect(await screen.findByText("Nenhum artigo encontrado.")).toBeInTheDocument();
    expect(screen.queryByText("Configurar a VPN")).not.toBeInTheDocument();
  });

  it("sem filtros e sem artigos mantém a mensagem de base vazia", async () => {
    baseConhecimentoService.listar.mockResolvedValue([]);
    render(<BaseConhecimento />);

    expect(await screen.findByText("Nenhum artigo publicado ainda.")).toBeInTheDocument();
  });

  it("resposta atrasada de uma busca antiga não sobrescreve a mais nova", async () => {
    let responderAntiga;
    baseConhecimentoService.listar
      .mockResolvedValueOnce([VPN]) // carga inicial
      .mockReturnValueOnce(new Promise((r) => (responderAntiga = r))) // "imp" (fica pendurada)
      .mockResolvedValueOnce([]); // "impressora"
    render(<BaseConhecimento />);
    await screen.findByText("Configurar a VPN");
    const campo = screen.getByRole("searchbox", { name: "Buscar" });

    fireEvent.change(campo, { target: { value: "imp" } });
    await waitFor(() => expect(baseConhecimentoService.listar).toHaveBeenCalledTimes(2));
    fireEvent.change(campo, { target: { value: "impressora" } });
    expect(await screen.findByText("Nenhum artigo encontrado.")).toBeInTheDocument();

    responderAntiga([VPN]);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText("Configurar a VPN")).not.toBeInTheDocument();
  });

  it("erro ao carregar avisa a pessoa", async () => {
    baseConhecimentoService.listar.mockRejectedValue(new Error("falhou"));
    render(<BaseConhecimento />);

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("Erro ao carregar os artigos", "erro"));
  });
});
