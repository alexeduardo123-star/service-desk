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

  it("cai para o valor bruto quando o status não tem rótulo mapeado", () => {
    render(<StatusBadge status="STATUS_DESCONHECIDO" />);
    expect(screen.getByText("STATUS_DESCONHECIDO")).toBeInTheDocument();
  });
});
