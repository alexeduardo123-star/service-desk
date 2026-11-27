import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuConfiguracoes from "./MenuConfiguracoes";

function renderizar(usuario) {
  return render(
    <MemoryRouter>
      <MenuConfiguracoes usuario={usuario} />
    </MemoryRouter>
  );
}

const abrir = () => fireEvent.click(screen.getByRole("button", { name: "Configurações" }));

describe("MenuConfiguracoes", () => {
  it("é um botão de engrenagem, fechado até clicar", () => {
    renderizar({ papel: "ADMIN" });

    expect(screen.getByRole("button", { name: "Configurações" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Menu de configurações" })).not.toBeInTheDocument();
  });

  it("administrador vê as preferências e todos os cadastros agrupados", () => {
    renderizar({ papel: "ADMIN" });
    abrir();

    expect(screen.getByRole("link", { name: "Minhas preferências" })).toHaveAttribute("href", "/configuracoes");
    for (const nome of ["Usuários", "Perfis e permissões", "Setores", "Categorias", "Prioridades", "Serviços", "Assuntos", "Formulários", "Equipamentos", "Fornecedores", "Contratos"]) {
      expect(screen.getByRole("link", { name: nome })).toBeInTheDocument();
    }
    expect(screen.getByText("Atendimento")).toBeInTheDocument();
  });

  it("solicitante só vê as próprias preferências", () => {
    renderizar({ papel: "SOLICITANTE" });
    abrir();

    expect(screen.getByRole("link", { name: "Minhas preferências" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument();
    expect(screen.queryByText("Atendimento")).not.toBeInTheDocument();
  });

  it("fecha com Esc e ao clicar fora", () => {
    renderizar({ papel: "ADMIN" });

    abrir();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Menu de configurações" })).not.toBeInTheDocument();

    abrir();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("navigation", { name: "Menu de configurações" })).not.toBeInTheDocument();
  });

  it("ao escolher um item o menu fecha", () => {
    renderizar({ papel: "ADMIN" });
    abrir();

    fireEvent.click(screen.getByRole("link", { name: "Assuntos" }));

    expect(screen.queryByRole("navigation", { name: "Menu de configurações" })).not.toBeInTheDocument();
  });
});
