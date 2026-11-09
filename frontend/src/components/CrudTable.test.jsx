
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CrudTable from "./CrudTable";

vi.mock("../store/useNotification", () => ({
  useNotification: () => ({
    notificar: vi.fn(),
  }),
}));

describe("CrudTable", () => {
  const registro = {
    id: 1,
    titulo: "Contrato de manutenção",
    inicio: "2026-11-09T00:00:00.000Z",
    fim: "2027-11-09T00:00:00.000Z",
  };

  const campos = [
    { name: "titulo", label: "Título", type: "text", required: true },
    { name: "inicio", label: "Início", type: "date", required: true },
    { name: "fim", label: "Fim", type: "date", required: true },
  ];

  const colunas = [
    { key: "titulo", label: "Título" },
  ];

  function renderizar(service) {
    return render(
      <CrudTable
        titulo="Contratos"
        campos={campos}
        colunas={colunas}
        service={service}
      />
    );
  }

  it("carrega e apresenta os registros", async () => {
    const service = {
      listar: vi.fn().mockResolvedValue([registro]),
    };

    renderizar(service);

    expect(
      await screen.findByText("Contrato de manutenção")
    ).toBeInTheDocument();

    expect(service.listar).toHaveBeenCalled();
  });

  it("converte datas ISO para o formato aceito pelo input date", async () => {
    const service = {
      listar: vi.fn().mockResolvedValue([registro]),
    };

    renderizar(service);

    await screen.findByText("Contrato de manutenção");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Início")).toHaveValue("2026-11-09");
    expect(screen.getByLabelText("Fim")).toHaveValue("2027-11-09");
  });

  it("envia as alterações para o serviço", async () => {
    const service = {
      listar: vi.fn().mockResolvedValue([registro]),
      atualizar: vi.fn().mockResolvedValue({}),
    };

    renderizar(service);

    await screen.findByText("Contrato de manutenção");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Contrato atualizado" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" })
    );

    await waitFor(() => {
      expect(service.atualizar).toHaveBeenCalledWith(1, {
        titulo: "Contrato atualizado",
        inicio: "2026-11-09",
        fim: "2027-11-09",
      });
    });
  });
});
