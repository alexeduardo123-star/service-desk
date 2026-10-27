import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Toggle from "./Toggle";

describe("Toggle", () => {
  it("mostra o rótulo e a descrição", () => {
    render(<Toggle label="Receber email" descricao="Avisos por email" checked={false} onChange={() => {}} />);
    expect(screen.getByText("Receber email")).toBeInTheDocument();
    expect(screen.getByText("Avisos por email")).toBeInTheDocument();
  });

  it("chama onChange com o novo valor booleano", () => {
    const onChange = vi.fn();
    render(<Toggle label="Receber email" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
