import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import Modal from "./Modal";

function Exemplo({ onFechar = vi.fn() }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>Abrir</button>
      {aberto && (
        <Modal
          titulo="Confirmar ação"
          onFechar={() => {
            onFechar();
            setAberto(false);
          }}
        >
          <input aria-label="Primeiro" />
          <button type="button">Último</button>
        </Modal>
      )}
    </>
  );
}

describe("Modal", () => {
  it("é um diálogo modal com o título como nome", () => {
    render(<Exemplo />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    const dialogo = screen.getByRole("dialog", { name: "Confirmar ação" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
  });

  it("leva o foco para dentro ao abrir", () => {
    render(<Exemplo />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    expect(screen.getByLabelText("Primeiro")).toHaveFocus();
  });

  it("prende o foco: Tab no último volta ao primeiro e Shift+Tab no primeiro vai ao último", () => {
    render(<Exemplo />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    const primeiro = screen.getByLabelText("Primeiro");
    const ultimo = screen.getByRole("button", { name: "Último" });

    ultimo.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(primeiro).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(ultimo).toHaveFocus();
  });

  it("Esc fecha e o foco volta para quem abriu", () => {
    const onFechar = vi.fn();
    render(<Exemplo onFechar={onFechar} />);
    const abrir = screen.getByRole("button", { name: "Abrir" });
    abrir.focus();
    fireEvent.click(abrir);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onFechar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it("clique no fundo fecha; clique dentro não", () => {
    const onFechar = vi.fn();
    render(<Exemplo onFechar={onFechar} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onFechar).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it("trava a rolagem da página enquanto está aberto", () => {
    render(<Exemplo />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });
});
