import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KanbanCard from "./KanbanCard";
import { COR_POR_NIVEL } from "../constants/cores";
import { AGORA, chamadoAntigo, chamadoCompleto } from "./cardsChamado.fixtures";

function renderizar(ticket, props = {}) {
  const onMover = vi.fn();
  render(
    <MemoryRouter>
      <KanbanCard
        ticket={ticket}
        podeMover={false}
        arrastando={false}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onMover={onMover}
        {...props}
      />
    </MemoryRouter>
  );
  return { onMover, card: screen.getByRole("article") };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("KanbanCard", () => {
  it("topo com número, título (link) e prioridade na cor do nível", () => {
    const { card } = renderizar(chamadoCompleto());

    expect(screen.getByRole("link", { name: "#42 Impressora do RH não imprime" })).toHaveAttribute("href", "/tickets/42");
    expect(screen.getByTitle("Prioridade: Urgente")).toBeInTheDocument();
    // A borda lateral continua na cor da prioridade (jsdom devolve a cor em rgb).
    expect(card.style.borderLeft).toContain("4px solid");
    expect(COR_POR_NIVEL[4]).toBe("#ef4444");
    expect(card.style.borderLeftColor).toBe("rgb(239, 68, 68)");
  });

  it("mostra assunto, setor, aprovação, SLA, pessoas e rodapé", () => {
    renderizar(chamadoCompleto());

    for (const texto of [
      "Impressoras",
      "Recursos Humanos",
      "Aprovado",
      "SLA vencido",
      "Solicitante: Ana",
      "Atendente: Bruno",
      "+2 colaboradores",
      "aberto há 3 dias",
    ]) {
      expect(screen.getByText(texto)).toBeInTheDocument();
    }
    expect(screen.getByText(/^Aberto em/)).toBeInTheDocument();
  });

  it("não repete o status (a coluna já mostra)", () => {
    renderizar(chamadoCompleto());
    expect(screen.queryByText("Em andamento")).not.toBeInTheDocument();
  });

  it("funciona com chamado antigo, sem assunto, setor, atendente ou colaboradores", () => {
    renderizar(chamadoAntigo());

    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Sem atendente")).toBeInTheDocument();
    expect(screen.queryByText(/colaborador/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Técnico|técnico/)).not.toBeInTheDocument();
  });

  it("quem pode mover vê o seletor de coluna e ele chama onMover", () => {
    const ticket = chamadoCompleto();
    const { onMover } = renderizar(ticket, { podeMover: true });

    fireEvent.change(screen.getByRole("combobox", { name: "Mover chamado 42 para" }), { target: { value: "FECHADO" } });

    expect(onMover).toHaveBeenCalledWith(ticket, "FECHADO");
  });

  it("quem não pode mover não vê o seletor", () => {
    renderizar(chamadoCompleto());
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
