import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AprovacaoBadge from "./AprovacaoBadge";

describe("AprovacaoBadge", () => {
  it("mostra o rótulo de cada situação", () => {
    const { rerender } = render(<AprovacaoBadge ticket={{ aprovacaoStatus: "PENDENTE" }} />);
    expect(screen.getByText("Aguardando aprovação")).toBeInTheDocument();

    rerender(<AprovacaoBadge ticket={{ aprovacaoStatus: "APROVADA" }} />);
    expect(screen.getByText("Aprovado")).toBeInTheDocument();

    rerender(<AprovacaoBadge ticket={{ aprovacaoStatus: "REJEITADA" }} />);
    expect(screen.getByText("Rejeitado")).toBeInTheDocument();
  });

  it("não mostra nada quando o chamado não exige aprovação", () => {
    const { container } = render(<AprovacaoBadge ticket={{ aprovacaoStatus: "NAO_EXIGIDA" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("não quebra com chamado antigo sem o campo", () => {
    const { container } = render(<AprovacaoBadge ticket={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
