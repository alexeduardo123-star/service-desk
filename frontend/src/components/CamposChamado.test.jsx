import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EtiquetasChamado, PessoasChamado, PrioridadeBadge, RodapeChamado } from "./CamposChamado";
import { COR_PRIORIDADE_PADRAO, corDaPrioridade, textoColaboradores } from "../utils/camposChamado";
import { COR_POR_NIVEL } from "../constants/cores";
import { AGORA, chamadoAntigo, chamadoCompleto } from "./cardsChamado.fixtures";

beforeEach(() => {
  // Só o Date é falso: SLA e "aberto há" ficam fixos sem travar os timers do React.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("textoColaboradores", () => {
  it("singular, plural e nada quando não há colaboradores", () => {
    expect(textoColaboradores([{ id: 1 }])).toBe("+1 colaborador");
    expect(textoColaboradores([{ id: 1 }, { id: 2 }, { id: 3 }])).toBe("+3 colaboradores");
    expect(textoColaboradores([])).toBeNull();
    expect(textoColaboradores(undefined)).toBeNull();
  });
});

describe("corDaPrioridade / PrioridadeBadge", () => {
  it("usa a cor do nível, com cinza para prioridade sem nível", () => {
    expect(corDaPrioridade({ nivel: 4 })).toBe(COR_POR_NIVEL[4]);
    expect(corDaPrioridade({ nivel: 9 })).toBe(COR_PRIORIDADE_PADRAO);
    expect(corDaPrioridade(null)).toBe(COR_PRIORIDADE_PADRAO);
  });

  it("mostra o nome escrito (não só a cor)", () => {
    render(<PrioridadeBadge prioridade={{ nome: "Urgente", nivel: 4 }} />);
    expect(screen.getByTitle("Prioridade: Urgente")).toHaveTextContent("Urgente");
  });

  it("não aparece sem prioridade", () => {
    const { container } = render(<PrioridadeBadge prioridade={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EtiquetasChamado", () => {
  it("mostra assunto, setor, aprovação e SLA vencido, nessa ordem", () => {
    const { container } = render(<EtiquetasChamado ticket={chamadoCompleto()} />);
    expect([...container.firstChild.children].map((e) => e.textContent)).toEqual([
      "Impressoras",
      "Recursos Humanos",
      "Aprovado",
      "SLA vencido",
    ]);
    expect(screen.queryByText("Hardware")).not.toBeInTheDocument();
  });

  it("sem assunto, mostra a categoria; sem setor nem aprovação, nada deles", () => {
    render(<EtiquetasChamado ticket={chamadoAntigo()} />);
    expect(screen.getByTitle("Categoria: Hardware")).toBeInTheDocument();
    expect(screen.queryByTitle(/^Setor/)).not.toBeInTheDocument();
    expect(screen.queryByText("SLA vencido")).not.toBeInTheDocument();
  });

  it("chamado fechado ou suspenso não aparece como SLA vencido", () => {
    for (const status of ["FECHADO", "SUSPENSO"]) {
      const { unmount } = render(<EtiquetasChamado ticket={chamadoCompleto({ status })} />);
      expect(screen.queryByText("SLA vencido")).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe("PessoasChamado", () => {
  it("mostra solicitante, atendente e quantos colaboradores (com os nomes no title)", () => {
    render(<PessoasChamado ticket={chamadoCompleto()} />);
    expect(screen.getByText("Solicitante: Ana")).toBeInTheDocument();
    expect(screen.getByText("Atendente: Bruno")).toBeInTheDocument();
    expect(screen.getByText("+2 colaboradores")).toHaveAttribute("title", "Carla, Davi");
  });

  it("sem atendente e sem colaboradores", () => {
    render(<PessoasChamado ticket={chamadoAntigo()} />);
    expect(screen.getByText("Sem atendente")).toBeInTheDocument();
    expect(screen.queryByText(/colaborador/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Técnico/)).not.toBeInTheDocument();
  });
});

describe("RodapeChamado", () => {
  it("mostra o tempo em aberto e a data de abertura", () => {
    render(<RodapeChamado ticket={chamadoCompleto()} />);
    expect(screen.getByText("aberto há 3 dias")).toBeInTheDocument();
    expect(screen.getByText(/^Aberto em \d{2}\/\d{2}\/2026/)).toBeInTheDocument();
  });

  it("sem data de abertura não quebra nem mostra lixo", () => {
    const { container } = render(<RodapeChamado ticket={chamadoAntigo({ createdAt: null })} />);
    expect(container.textContent).toBe("");
  });
});
