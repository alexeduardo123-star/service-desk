import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Paginacao from "./Paginacao";

describe("Paginacao", () => {
  it("não renderiza nada quando há só uma página", () => {
    const { container } = render(<Paginacao pagina={1} totalPaginas={1} total={3} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("avança e volta de página", () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={2} totalPaginas={3} total={25} onChange={onChange} />);
    fireEvent.click(screen.getByText("Próxima"));
    fireEvent.click(screen.getByText("Anterior"));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("desabilita Anterior na primeira página", () => {
    render(<Paginacao pagina={1} totalPaginas={3} total={25} onChange={() => {}} />);
    expect(screen.getByText("Anterior")).toBeDisabled();
  });
});
