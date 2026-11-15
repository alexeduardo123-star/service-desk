import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FormularioPreview from "./FormularioPreview";

describe("FormularioPreview", () => {
  it("avisa quando não há campos", () => {
    render(<FormularioPreview campos={[]} />);
    expect(screen.getByText("Nenhum campo adicionado.")).toBeInTheDocument();
  });

  it("renderiza cada tipo de campo com o controle certo", () => {
    render(
      <FormularioPreview
        campos={[
          { rotulo: "Patrimônio", tipo: "TEXTO" },
          { rotulo: "Detalhes", tipo: "TEXTO_LONGO" },
          { rotulo: "Quantidade", tipo: "NUMERO" },
          { rotulo: "Data do problema", tipo: "DATA" },
          { rotulo: "Sistema", tipo: "SELECAO", opcoes: ["ERP", "CRM"] },
          { rotulo: "Equipamento liga?", tipo: "CHECKBOX" },
        ]}
      />
    );

    expect(screen.getByLabelText("Patrimônio")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Detalhes").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Quantidade")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Data do problema")).toHaveAttribute("type", "date");
    expect(screen.getByRole("option", { name: "CRM" })).toBeInTheDocument();
    expect(screen.getByLabelText("Equipamento liga?")).toHaveAttribute("type", "checkbox");
  });

  it("marca campos obrigatórios com asterisco", () => {
    render(<FormularioPreview campos={[{ rotulo: "Setor", tipo: "TEXTO", obrigatorio: true }]} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
