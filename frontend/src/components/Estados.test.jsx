import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Carregando, ErroCarregar, Vazio } from "./Estados";
import CabecalhoPagina from "./CabecalhoPagina";

describe("estados padrão", () => {
  it("carregando e vazio são anunciados como status", () => {
    render(
      <>
        <Carregando />
        <Vazio />
      </>
    );
    const status = screen.getAllByRole("status").map((s) => s.textContent);
    expect(status).toEqual(["Carregando…", "Nenhum registro encontrado."]);
  });

  it("erro é um alerta e oferece tentar de novo", () => {
    const tentar = vi.fn();
    render(<ErroCarregar texto="Falhou." onTentarDeNovo={tentar} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falhou.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("erro sem ação não mostra o botão", () => {
    render(<ErroCarregar />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("CabecalhoPagina", () => {
  it("mostra o título como h1 e muda o título da aba para 'Título — FlowDesk'", () => {
    render(
      <CabecalhoPagina titulo="Chamados" descricao="Todos os chamados">
        <button type="button">Novo</button>
      </CabecalhoPagina>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Chamados" })).toBeInTheDocument();
    expect(screen.getByText("Todos os chamados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo" })).toBeInTheDocument();
    expect(document.title).toBe("Chamados — FlowDesk");
  });
});
