
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

    fireEvent.click(screen.getByRole("button", { name: "Editar Contrato de manutenção" }));

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

    fireEvent.click(screen.getByRole("button", { name: "Editar Contrato de manutenção" }));

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

  it("usa o padrão e envia booleano em campos do tipo checkbox", async () => {
    const service = {
      listar: vi.fn().mockResolvedValue([]),
      criar: vi.fn().mockResolvedValue({}),
    };

    render(
      <CrudTable
        titulo="Serviços"
        campos={[
          { name: "nome", label: "Nome", required: true },
          { name: "ativo", label: "Ativo", type: "checkbox", default: true },
        ]}
        colunas={[{ key: "nome", label: "Nome" }]}
        service={service}
      />
    );

    await screen.findByText("Nenhum registro encontrado.");
    fireEvent.click(screen.getByRole("button", { name: "Novo" }));

    expect(screen.getByRole("switch")).toBeChecked();

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Suporte" } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(service.criar).toHaveBeenCalledWith({ nome: "Suporte", ativo: false });
    });
  });

  describe("validação no front", () => {
    const camposForn = [
      { name: "nome", label: "Nome", required: true },
      { name: "telefone", label: "Telefone", formatar: (v) => v.replace(/\D/g, "").slice(0, 4) },
    ];
    const validar = (dados) => (dados.nome.trim() ? {} : { nome: "Informe o nome" });

    function renderizarForn(service) {
      return render(
        <CrudTable
          titulo="Fornecedores"
          campos={camposForn}
          colunas={[{ key: "nome", label: "Nome" }]}
          service={service}
          validar={validar}
        />
      );
    }

    it("mostra a mensagem embaixo do campo e não envia ao serviço", async () => {
      const service = { listar: vi.fn().mockResolvedValue([]), criar: vi.fn() };
      renderizarForn(service);

      await screen.findByText("Nenhum registro encontrado.");
      fireEvent.click(screen.getByRole("button", { name: "Novo" }));
      fireEvent.click(screen.getByRole("button", { name: "Criar" }));

      expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
      expect(service.criar).not.toHaveBeenCalled();
    });

    it("a mensagem some quando a pessoa volta a digitar no campo", async () => {
      const service = { listar: vi.fn().mockResolvedValue([]), criar: vi.fn() };
      renderizarForn(service);

      await screen.findByText("Nenhum registro encontrado.");
      fireEvent.click(screen.getByRole("button", { name: "Novo" }));
      fireEvent.click(screen.getByRole("button", { name: "Criar" }));
      await screen.findByText("Informe o nome");

      fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Acme" } });

      expect(screen.queryByText("Informe o nome")).not.toBeInTheDocument();
    });

    it("aplica a máscara do campo ao digitar e envia o valor formatado", async () => {
      const service = { listar: vi.fn().mockResolvedValue([]), criar: vi.fn().mockResolvedValue({}) };
      renderizarForn(service);

      await screen.findByText("Nenhum registro encontrado.");
      fireEvent.click(screen.getByRole("button", { name: "Novo" }));
      fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Acme" } });
      fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "12ab34567" } });

      expect(screen.getByLabelText("Telefone")).toHaveValue("1234");

      fireEvent.click(screen.getByRole("button", { name: "Criar" }));
      await waitFor(() => expect(service.criar).toHaveBeenCalledWith({ nome: "Acme", telefone: "1234" }));
    });
  });
});
