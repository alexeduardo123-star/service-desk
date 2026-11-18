import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";
import { StatusTicket } from "../enum/StatusTicket";
import { STATUS_LABEL } from "../constants/labels";

describe("StatusBadge", () => {
  it("mostra o rótulo em português do status", () => {
    render(<StatusBadge status={StatusTicket.EM_ANDAMENTO} />);
    expect(screen.getByText(STATUS_LABEL[StatusTicket.EM_ANDAMENTO])).toBeInTheDocument();
  });

  it("mostra o rótulo da espera do usuário com cor própria", () => {
    const { container } = render(<StatusBadge status={StatusTicket.AGUARDANDO_USUARIO} />);
    expect(screen.getByText("Aguardando resposta do usuário")).toBeInTheDocument();
    expect(container.firstChild.className).toContain("bg-purple-100");
  });

  it("mostra o rótulo de suspenso com cor própria", () => {
    const { container } = render(<StatusBadge status={StatusTicket.SUSPENSO} />);
    expect(screen.getByText("Suspenso")).toBeInTheDocument();
    expect(container.firstChild.className).toContain("bg-slate-200");
  });

  it("cai para o valor bruto quando o status não tem rótulo mapeado", () => {
    render(<StatusBadge status="STATUS_DESCONHECIDO" />);
    expect(screen.getByText("STATUS_DESCONHECIDO")).toBeInTheDocument();
  });
});
