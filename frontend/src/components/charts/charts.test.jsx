import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BarChart from "./BarChart";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import StatCard from "./StatCard";

describe("BarChart", () => {
  it("mostra rótulos e valores", () => {
    render(<BarChart itens={[{ rotulo: "Hardware", valor: 5 }, { rotulo: "Rede", valor: 2 }]} />);
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("mostra mensagem quando não há itens", () => {
    render(<BarChart itens={[]} vazio="Nada por aqui" />);
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });
});

describe("DonutChart", () => {
  it("mostra o total e a legenda", () => {
    render(<DonutChart itens={[{ rotulo: "Abertos", valor: 3 }, { rotulo: "Fechados", valor: 1 }]} rotuloTotal="chamados" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Gráfico de rosca, 4 chamados");
    expect(screen.getByText("Abertos")).toBeInTheDocument();
  });

  it("mostra mensagem quando tudo é zero", () => {
    render(<DonutChart itens={[{ rotulo: "Abertos", valor: 0 }]} />);
    expect(screen.getByText("Sem dados no período.")).toBeInTheDocument();
  });
});

describe("LineChart", () => {
  it("renderiza as legendas das séries", () => {
    render(
      <LineChart
        rotulos={["01/10", "02/10"]}
        series={[{ nome: "Abertos", cor: "#f00", valores: [1, 3] }, { nome: "Fechados", cor: "#0f0", valores: [0, 2] }]}
      />
    );
    expect(screen.getByText("Abertos")).toBeInTheDocument();
    expect(screen.getByText("Fechados")).toBeInTheDocument();
  });

  it("mostra mensagem quando todas as séries são zero", () => {
    render(<LineChart rotulos={["01/10"]} series={[{ nome: "Abertos", cor: "#f00", valores: [0] }]} />);
    expect(screen.getByText("Sem dados no período.")).toBeInTheDocument();
  });
});

describe("StatCard", () => {
  it("mostra título, valor e detalhe", () => {
    render(<StatCard titulo="SLA vencido" valor={3} detalhe="chamados em atraso" destaque />);
    expect(screen.getByText("SLA vencido")).toBeInTheDocument();
    expect(screen.getByText("3")).toHaveClass("text-red-600");
    expect(screen.getByText("chamados em atraso")).toBeInTheDocument();
  });
});
