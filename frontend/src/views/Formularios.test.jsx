import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const notificar = vi.fn();

vi.mock("../store/useNotification", () => ({
  useNotification: () => ({ notificar }),
}));

vi.mock("../services/formularioService", () => ({
  default: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  },
}));

const formularioService = (await import("../services/formularioService")).default;
const { default: Formularios } = await import("./Formularios");

const salvo = {
  id: 7,
  nome: "Solicitação de acesso",
  descricao: null,
  ativo: true,
  campos: [{ id: 1, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"], ordem: 0 }],
  _count: { assuntos: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
  formularioService.listar.mockResolvedValue([salvo]);
});

describe("Formularios", () => {
  it("lista os formulários com a quantidade de campos e assuntos", async () => {
    render(<Formularios />);

    expect(await screen.findByText("Solicitação de acesso")).toBeInTheDocument();
    const celulas = within(screen.getByText("Solicitação de acesso").closest("tr")).getAllByRole("cell");
    expect(celulas[1]).toHaveTextContent("1");
    expect(celulas[2]).toHaveTextContent("2");
  });

  it("cria um formulário com os campos montados na tela", async () => {
    formularioService.criar.mockResolvedValue({ id: 8 });
    render(<Formularios />);
    await screen.findByText("Solicitação de acesso");

    fireEvent.click(screen.getByRole("button", { name: "Novo" }));
    fireEvent.change(screen.getByLabelText("Nome do formulário"), { target: { value: "Troca de equipamento" } });
    fireEvent.change(screen.getByLabelText("Campo 1"), { target: { value: "Patrimônio" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Adicionar campo" }));
    fireEvent.change(screen.getByLabelText("Campo 2"), { target: { value: "Turno" } });
    fireEvent.change(screen.getByLabelText("Tipo do campo 2"), { target: { value: "SELECAO" } });
    fireEvent.change(screen.getByLabelText("Opções (uma por linha)"), { target: { value: "Manhã\nTarde" } });

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(formularioService.criar).toHaveBeenCalledWith({
        nome: "Troca de equipamento",
        descricao: null,
        ativo: true,
        campos: [
          { rotulo: "Patrimônio", tipo: "TEXTO", obrigatorio: false, opcoes: [] },
          { rotulo: "Turno", tipo: "SELECAO", obrigatorio: false, opcoes: ["Manhã", "Tarde"] },
        ],
      });
    });
  });

  it("não envia quando a validação falha", async () => {
    render(<Formularios />);
    await screen.findByText("Solicitação de acesso");

    fireEvent.click(screen.getByRole("button", { name: "Novo" }));
    fireEvent.change(screen.getByLabelText("Nome do formulário"), { target: { value: "Teste" } });
    fireEvent.change(screen.getByLabelText("Campo 1"), { target: { value: "Turno" } });
    fireEvent.change(screen.getByLabelText("Tipo do campo 1"), { target: { value: "SELECAO" } });
    fireEvent.submit(screen.getByRole("button", { name: "Criar" }).closest("form"));

    expect(notificar).toHaveBeenCalledWith('O campo "Turno" precisa de pelo menos 2 opções', "erro");
    expect(formularioService.criar).not.toHaveBeenCalled();
  });

  it("carrega os campos existentes ao editar", async () => {
    formularioService.atualizar.mockResolvedValue({});
    render(<Formularios />);
    await screen.findByText("Solicitação de acesso");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Campo 1")).toHaveValue("Sistema");
    expect(screen.getByLabelText("Opções (uma por linha)")).toHaveValue("ERP\nCRM");

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(formularioService.atualizar).toHaveBeenCalledWith(7, expect.objectContaining({ nome: "Solicitação de acesso" }));
    });
  });
});
