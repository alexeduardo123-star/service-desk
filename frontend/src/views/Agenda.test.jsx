import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const notificar = vi.fn();
let usuarioLogado;

vi.mock("../store/useNotification", () => ({ useNotification: () => ({ notificar }) }));
vi.mock("../auth/useAuth", () => ({ useAuth: () => ({ usuario: usuarioLogado }) }));
vi.mock("../services/agendaService", () => ({
  default: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
vi.mock("../services/usuarioService", () => ({ default: { atendentes: vi.fn() } }));

const agendaService = (await import("../services/agendaService")).default;
const usuarioService = (await import("../services/usuarioService")).default;
const { default: Agenda } = await import("./Agenda");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const GESTOR = { id: 30, nome: "Gestora", papel: "GESTOR" };

// Dia de hoje no fuso padrão do app, para o calendário abrir no mês certo.
const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

function renderizar() {
  return render(
    <MemoryRouter>
      <Agenda />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  usuarioLogado = TECNICO;
  usuarioService.atendentes.mockResolvedValue([
    { id: 20, nome: "Téc" },
    { id: 21, nome: "Redes" },
  ]);
  agendaService.listar.mockResolvedValue({
    prazos: [
      { ticketId: 7, titulo: "VPN não conecta", status: "ABERTO", prazo: `${hoje}T15:00:00Z`, vencido: false, prioridade: { id: 2, nome: "Alta" }, tecnico: { id: 20, nome: "Téc" } },
    ],
    agendamentos: [
      { id: 1, titulo: "Visita ao cliente", descricao: "Levar notebook", inicio: `${hoje}T13:00:00Z`, fim: `${hoje}T14:00:00Z`, atendente: { id: 20, nome: "Téc" }, ticket: { id: 7, titulo: "VPN não conecta" } },
      { id: 2, titulo: "Treinamento", descricao: null, inicio: `${hoje}T17:00:00Z`, fim: `${hoje}T18:00:00Z`, atendente: { id: 21, nome: "Redes" }, ticket: null },
    ],
  });
});

describe("Agenda", () => {
  it("consulta o período do mês e mostra atendimentos e prazos do dia selecionado", async () => {
    renderizar();

    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    expect(await within(detalhes).findByText("Visita ao cliente")).toBeInTheDocument();
    expect(within(detalhes).getByText(/#7 VPN não conecta/)).toBeInTheDocument();
    expect(within(detalhes).getByText("Prazos de SLA")).toBeInTheDocument();

    const periodo = agendaService.listar.mock.calls[0][0];
    expect(new Date(periodo.fim) - new Date(periodo.inicio)).toBeLessThanOrEqual(62 * 86_400_000);
  });

  it("técnico só edita/cancela os próprios atendimentos", async () => {
    renderizar();
    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await within(detalhes).findByText("Visita ao cliente");

    // Dois atendimentos no dia, mas só o do próprio técnico tem Editar/Cancelar.
    expect(within(detalhes).getAllByRole("button", { name: "Editar" })).toHaveLength(1);
    expect(within(detalhes).getAllByRole("button", { name: "Cancelar" })).toHaveLength(1);
  });

  it("gestor (agenda.todos) altera atendimentos de todos", async () => {
    usuarioLogado = GESTOR;
    renderizar();
    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await within(detalhes).findByText("Treinamento");

    expect(within(detalhes).getAllByRole("button", { name: "Editar" })).toHaveLength(2);
  });

  it("agenda um atendimento novo e recarrega", async () => {
    agendaService.criar.mockResolvedValue({ id: 3 });
    renderizar();
    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await within(detalhes).findByText("Visita ao cliente");

    fireEvent.click(within(detalhes).getByRole("button", { name: "Agendar" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Instalar impressora" } });
    fireEvent.click(screen.getByRole("button", { name: "Agendar"}));

    await waitFor(() => expect(agendaService.criar).toHaveBeenCalled());
    const corpo = agendaService.criar.mock.calls[0][0];
    expect(corpo).toMatchObject({ titulo: "Instalar impressora", ticketId: null });
    expect(corpo.inicio).toMatch(/Z$/);
    expect(agendaService.listar.mock.calls.length).toBeGreaterThan(1);
  });

  it("mostra a mensagem do servidor quando há conflito de horário", async () => {
    agendaService.criar.mockRejectedValue({ response: { data: { erro: "O atendente já tem um atendimento nesse horário: Reunião" } } });
    renderizar();
    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await within(detalhes).findByText("Visita ao cliente");

    fireEvent.click(within(detalhes).getByRole("button", { name: "Agendar" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Outro" } });
    fireEvent.click(screen.getByRole("button", { name: "Agendar"}));

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("O atendente já tem um atendimento nesse horário: Reunião", "erro"));
  });

  it("valida o formulário antes de enviar (fim depois do início)", async () => {
    renderizar();
    const detalhes = await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await within(detalhes).findByText("Visita ao cliente");

    fireEvent.click(within(detalhes).getByRole("button", { name: "Agendar" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Teste" } });
    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: `${hoje}T08:00` } });
    fireEvent.click(screen.getByRole("button", { name: "Agendar"}));

    expect(await screen.findByText("O fim deve ser depois do início")).toBeInTheDocument();
    expect(agendaService.criar).not.toHaveBeenCalled();
  });

  it("filtra por atendente", async () => {
    renderizar();
    await screen.findByRole("complementary", { name: "Detalhes do dia" });
    await screen.findByRole("option", { name: "Redes" });

    fireEvent.change(screen.getByLabelText("Atendente"), { target: { value: "21" } });

    await waitFor(() => expect(agendaService.listar).toHaveBeenLastCalledWith(expect.objectContaining({ atendenteId: "21" })));
  });
});
