import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo", () => {
  it("tem texto alternativo com o nome do produto", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "Logo FlowDesk" })).toBeInTheDocument();
  });

  it("mostra o nome ao lado do símbolo por padrão", () => {
    const { container } = render(<Logo />);
    expect(container.textContent).toBe("FlowDesk");
  });

  it("pode mostrar só o símbolo", () => {
    const { container } = render(<Logo mostrarNome={false} />);
    expect(container.textContent).toBe("");
  });

  it("respeita o tamanho informado", () => {
    render(<Logo tamanho={48} />);
    expect(screen.getByRole("img", { name: "Logo FlowDesk" })).toHaveAttribute("width", "48");
  });
});
