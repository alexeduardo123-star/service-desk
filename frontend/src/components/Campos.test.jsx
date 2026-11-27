import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import TextAreaField from "./TextAreaField";

// InputField, SelectField e TextAreaField seguem o mesmo contrato de acessibilidade.
const CASOS = [
  ["InputField", (props) => <InputField {...props} />, "textbox"],
  ["SelectField", (props) => <SelectField options={[{ value: "1", label: "Um" }]} {...props} />, "combobox"],
  ["TextAreaField", (props) => <TextAreaField {...props} />, "textbox"],
];

describe.each(CASOS)("%s", (_nome, renderizarCampo, papel) => {
  it("liga o rótulo ao campo por htmlFor/id", () => {
    render(renderizarCampo({ label: "Nome" }));

    const campo = screen.getByRole(papel, { name: "Nome" });
    const rotulo = screen.getByText("Nome");
    expect(rotulo.tagName).toBe("LABEL");
    expect(rotulo).toHaveAttribute("for", campo.id);
  });

  it("liga a ajuda e o erro ao campo por aria-describedby, fora do nome acessível", () => {
    render(renderizarCampo({ label: "Nome", ajuda: "Como aparece no chamado", error: "Informe o nome" }));

    const campo = screen.getByRole(papel, { name: "Nome" });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Como aparece no chamado Informe o nome");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome");
  });

  it("sem erro não marca o campo como inválido", () => {
    render(renderizarCampo({ label: "Nome" }));

    const campo = screen.getByRole(papel, { name: "Nome" });
    expect(campo).not.toHaveAttribute("aria-invalid");
    expect(campo).not.toHaveAttribute("aria-describedby");
  });

  it("respeita um id e um aria-describedby passados por fora", () => {
    render(
      <>
        <p id="extra">Texto extra</p>
        {renderizarCampo({ label: "Nome", id: "meu-campo", "aria-describedby": "extra", ajuda: "Ajuda" })}
      </>
    );

    const campo = screen.getByRole(papel, { name: "Nome" });
    expect(campo).toHaveAttribute("id", "meu-campo");
    expect(campo).toHaveAccessibleDescription("Texto extra Ajuda");
  });
});
