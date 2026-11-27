import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicketCard from "./TicketCard";
import { AGORA, chamadoAntigo, chamadoCompleto } from "./cardsChamado.fixtures";

function renderizar(ticket) {
  return render(
    <MemoryRouter>
      <TicketCard ticket={ticket} />
    </MemoryRouter>
  );
}

// Posição de cada texto no card, para conferir a ordem das partes.
function posicao(container, texto) {
  const i = container.textContent.indexOf(texto);
  if (i < 0) throw new Error(`"${texto}" não está no card`);
  return i;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TicketCard", () => {
  it("leva ao detalhe e mostra número, título, status e prioridade no topo", () => {
    renderizar(chamadoCompleto());

    expect(screen.getByRole("link")).toHaveAttribute("href", "/tickets/42");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("#42 Impressora do RH não imprime");
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByTitle("Prioridade: Urgente")).toBeInTheDocument();
  });

  it("segue a ordem: topo, descrição, etiquetas, pessoas, rodapé", () => {
    const { container } = renderizar(chamadoCompleto());

    const ordem = [
      "#42",
      "Desde ontem a impressora",
      "Impressoras",
      "SLA vencido",
      "Solicitante: Ana",
      "Atendente: Bruno",
      "+2 colaboradores",
      "aberto há 3 dias",
      "Aberto em",
    ].map((t) => posicao(container, t));
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
  });

  it("descrição continua cortada em duas linhas", () => {
    renderizar(chamadoCompleto());
    expect(screen.getByText(/Desde ontem a impressora/)).toHaveClass("line-clamp-2");
  });

  it("mostra o SLA vencido e o setor (antes só o Kanban mostrava o SLA)", () => {
    renderizar(chamadoCompleto());
    expect(screen.getByText("SLA vencido")).toBeInTheDocument();
    expect(screen.getByText("Recursos Humanos")).toBeInTheDocument();
  });

  it("funciona com chamado antigo, sem assunto, setor, atendente, descrição ou colaboradores", () => {
    renderizar(chamadoAntigo());

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("#3 Mouse quebrado");
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Sem atendente")).toBeInTheDocument();
    expect(screen.getByText("aberto há 30 min")).toBeInTheDocument();
    expect(screen.queryByText(/colaborador/)).not.toBeInTheDocument();
    expect(screen.queryByText("SLA vencido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Técnico/)).not.toBeInTheDocument();
  });
});
