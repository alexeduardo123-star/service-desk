import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const notificar = vi.fn();
let usuarioLogado;

vi.mock("../store/useNotification", () => ({
  useNotification: () => ({ notificar }),
}));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ usuario: usuarioLogado }),
}));

vi.mock("../services/ticketService", () => ({
  default: {
    buscar: vi.fn(),
    alterarStatus: vi.fn(),
    atribuir: vi.fn(),
    suspender: vi.fn(),
    retomar: vi.fn(),
    aprovar: vi.fn(),
    rejeitar: vi.fn(),
    encaminhar: vi.fn(),
    adicionarColaborador: vi.fn(),
    removerColaborador: vi.fn(),
  },
}));

vi.mock("../services/usuarioService", () => ({
  default: {
    listar: vi.fn().mockResolvedValue([]),
    atendentes: vi.fn().mockResolvedValue([
      { id: 20, nome: "Téc", papel: "TECNICO" },
      { id: 21, nome: "Bruno", papel: "TECNICO" },
      { id: 1, nome: "Admin", papel: "ADMIN" },
    ]),
  },
}));

vi.mock("../services/comentarioService", () => ({
  default: { criar: vi.fn() },
}));

const ticketService = (await import("../services/ticketService")).default;
const { default: TicketDetalhe } = await import("./TicketDetalhe");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const SOLICITANTE = { id: 10, nome: "Ana", papel: "SOLICITANTE" };
const GESTOR = { id: 30, nome: "Gê", papel: "GESTOR" };

function chamado(extra = {}) {
  return {
    id: 7,
    titulo: "VPN não conecta",
    descricao: "Desde ontem",
    status: "EM_ANDAMENTO",
    createdAt: "2026-11-18T10:00:00Z",
    closedAt: null,
    categoria: { nome: "Rede" },
    prioridade: { nome: "Alta" },
    solicitante: { id: 10, nome: "Ana" },
    tecnico: { id: 20, nome: "Téc" },
    comentarios: [],
    ...extra,
  };
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/tickets/7"]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetalhe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  usuarioLogado = TECNICO;
});

describe("TicketDetalhe: suspender", () => {
  it("o seletor de status não oferece Suspenso", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    const select = await screen.findByRole("combobox", { name: /^Status/ });
    const opcoes = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).not.toContain("Suspenso");
  });

  it("exige o motivo antes de suspender", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    const confirmar = screen.getByRole("button", { name: "Confirmar suspensão" });
    expect(confirmar).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: "   " } });
    expect(confirmar).toBeDisabled();
    fireEvent.submit(confirmar.closest("form"));

    expect(notificar).toHaveBeenCalledWith("Informe o motivo da suspensão", "erro");
    expect(ticketService.suspender).not.toHaveBeenCalled();
  });

  it("suspende com o motivo informado e recarrega o chamado", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.suspender.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: " aguardando peça " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar suspensão" }));

    await waitFor(() => expect(ticketService.suspender).toHaveBeenCalledWith("7", "aguardando peça"));
    expect(notificar).toHaveBeenCalledWith("Chamado suspenso");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
  });

  it("mostra o erro da API quando a suspensão é recusada", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.suspender.mockRejectedValue({ response: { data: { erro: "O chamado já está suspenso" } } });
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Suspender" }));
    fireEvent.change(screen.getByLabelText("Motivo da suspensão"), { target: { value: "motivo" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar suspensão" }));

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("O chamado já está suspenso", "erro"));
  });

  it("chamado fechado não oferece Suspender", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ status: "FECHADO", closedAt: "2026-11-18T12:00:00Z" }));
    renderizar();

    await screen.findByRole("combobox", { name: /^Status/ });
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
  });
});

describe("TicketDetalhe: encaminhar", () => {
  async function abrirModal() {
    fireEvent.click(await screen.findByRole("button", { name: "Encaminhar" }));
    return screen.getByRole("dialog", { name: "Encaminhar chamado" });
  }

  it("lista os atendentes sem o atual", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    const modal = await abrirModal();
    const select = within(modal).getByRole("combobox", { name: "Encaminhar para" });
    await waitFor(() => expect(within(select).getAllByRole("option")).toHaveLength(3));
    const opcoes = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(["Selecione o atendente", "Bruno", "Admin"]);
  });

  it("só libera o envio com atendente escolhido e motivo de pelo menos 5 caracteres", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    const modal = await abrirModal();
    const enviar = within(modal).getByRole("button", { name: "Encaminhar" });
    expect(enviar).toBeDisabled();

    await waitFor(() => within(modal).getByRole("option", { name: "Bruno" }));
    fireEvent.change(within(modal).getByRole("combobox"), { target: { value: "21" } });
    expect(enviar).toBeDisabled();

    fireEvent.change(within(modal).getByLabelText("Motivo"), { target: { value: "  abc  " } });
    expect(enviar).toBeDisabled();
    expect(within(modal).getByText(/pelo menos 5 caracteres/)).toBeInTheDocument();

    fireEvent.change(within(modal).getByLabelText("Motivo"), { target: { value: "abcde" } });
    expect(enviar).toBeEnabled();
  });

  it("encaminha, avisa e recarrega o chamado", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.encaminhar.mockResolvedValue(chamado({ tecnico: { id: 21, nome: "Bruno" } }));
    renderizar();

    const modal = await abrirModal();
    await waitFor(() => within(modal).getByRole("option", { name: "Bruno" }));
    fireEvent.change(within(modal).getByRole("combobox"), { target: { value: "21" } });
    fireEvent.change(within(modal).getByLabelText("Motivo"), { target: { value: " especialista em rede " } });
    fireEvent.click(within(modal).getByRole("button", { name: "Encaminhar" }));

    await waitFor(() => expect(ticketService.encaminhar).toHaveBeenCalledWith("7", 21, "especialista em rede"));
    expect(notificar).toHaveBeenCalledWith("Chamado encaminhado");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mostra o erro da API e mantém o modal aberto", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    ticketService.encaminhar.mockRejectedValue({ response: { data: { erro: "O chamado já está com este atendente" } } });
    renderizar();

    const modal = await abrirModal();
    await waitFor(() => within(modal).getByRole("option", { name: "Bruno" }));
    fireEvent.change(within(modal).getByRole("combobox"), { target: { value: "21" } });
    fireEvent.change(within(modal).getByLabelText("Motivo"), { target: { value: "motivo qualquer" } });
    fireEvent.click(within(modal).getByRole("button", { name: "Encaminhar" }));

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("O chamado já está com este atendente", "erro"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancelar fecha o modal sem encaminhar", async () => {
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    const modal = await abrirModal();
    fireEvent.click(within(modal).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(ticketService.encaminhar).not.toHaveBeenCalled();
  });

  it("não aparece em chamado fechado nem para quem não trata chamados", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ status: "FECHADO", closedAt: "2026-11-18T12:00:00Z" }));
    const { unmount } = renderizar();
    await screen.findByRole("combobox", { name: /^Status/ });
    expect(screen.queryByRole("button", { name: "Encaminhar" })).not.toBeInTheDocument();
    unmount();

    usuarioLogado = SOLICITANTE;
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();
    await screen.findByText("VPN não conecta");
    expect(screen.queryByRole("button", { name: "Encaminhar" })).not.toBeInTheDocument();
  });
});

describe("TicketDetalhe: colaboradores", () => {
  const secao = () => screen.findByRole("region", { name: "Colaboradores" });

  it("lista os colaboradores e só oferece quem ainda pode entrar", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [{ id: 1, nome: "Admin" }] }));
    renderizar();

    const regiao = await secao();
    expect(within(regiao).getByText("Admin")).toBeInTheDocument();
    const select = within(regiao).getByRole("combobox", { name: "Adicionar colaborador" });
    // Téc é o responsável e Admin já colabora: sobra só o Bruno.
    await waitFor(() => expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["Selecione…", "Bruno"]));
  });

  it("adiciona o colaborador escolhido, avisa e recarrega", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [] }));
    ticketService.adicionarColaborador.mockResolvedValue([{ id: 21, nome: "Bruno" }]);
    renderizar();

    const regiao = await secao();
    expect(within(regiao).getByText("Nenhum colaborador neste chamado.")).toBeInTheDocument();
    const adicionar = within(regiao).getByRole("button", { name: "Adicionar" });
    expect(adicionar).toBeDisabled();

    await waitFor(() => within(regiao).getByRole("option", { name: "Bruno" }));
    fireEvent.change(within(regiao).getByRole("combobox"), { target: { value: "21" } });
    fireEvent.click(adicionar);

    await waitFor(() => expect(ticketService.adicionarColaborador).toHaveBeenCalledWith("7", 21));
    expect(notificar).toHaveBeenCalledWith("Colaborador adicionado");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
  });

  it("mostra o erro da API ao adicionar", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [] }));
    ticketService.adicionarColaborador.mockRejectedValue({ response: { data: { erro: "Este usuário já é colaborador do chamado" } } });
    renderizar();

    const regiao = await secao();
    await waitFor(() => within(regiao).getByRole("option", { name: "Bruno" }));
    fireEvent.change(within(regiao).getByRole("combobox"), { target: { value: "21" } });
    fireEvent.click(within(regiao).getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(notificar).toHaveBeenCalledWith("Este usuário já é colaborador do chamado", "erro"));
  });

  it("remove o colaborador, avisa e recarrega", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [{ id: 21, nome: "Bruno" }] }));
    ticketService.removerColaborador.mockResolvedValue([]);
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Remover Bruno dos colaboradores" }));

    await waitFor(() => expect(ticketService.removerColaborador).toHaveBeenCalledWith("7", 21));
    expect(notificar).toHaveBeenCalledWith("Colaborador removido");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
  });

  it("mostra o erro da API ao remover", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [{ id: 21, nome: "Bruno" }] }));
    ticketService.removerColaborador.mockRejectedValue({ response: { data: { erro: "Chamado fechado não aceita mudanças nos colaboradores" } } });
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Remover Bruno dos colaboradores" }));

    await waitFor(() =>
      expect(notificar).toHaveBeenCalledWith("Chamado fechado não aceita mudanças nos colaboradores", "erro")
    );
  });

  it("chamado fechado só mostra a lista, sem adicionar nem remover", async () => {
    ticketService.buscar.mockResolvedValue(
      chamado({ status: "FECHADO", closedAt: "2026-11-18T12:00:00Z", colaboradores: [{ id: 21, nome: "Bruno" }] })
    );
    renderizar();

    const regiao = await secao();
    expect(within(regiao).getByText("Bruno")).toBeInTheDocument();
    expect(within(regiao).queryByRole("button")).not.toBeInTheDocument();
    expect(within(regiao).queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("quem não trata chamados vê a lista sem ações, e nada quando não há colaboradores", async () => {
    usuarioLogado = SOLICITANTE;
    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [{ id: 21, nome: "Bruno" }] }));
    const { unmount } = renderizar();

    const regiao = await secao();
    expect(within(regiao).getByText("Bruno")).toBeInTheDocument();
    expect(within(regiao).queryByRole("button")).not.toBeInTheDocument();
    unmount();

    ticketService.buscar.mockResolvedValue(chamado({ colaboradores: [] }));
    renderizar();
    await screen.findByText("VPN não conecta");
    expect(screen.queryByRole("region", { name: "Colaboradores" })).not.toBeInTheDocument();
  });
});

describe("TicketDetalhe: retomar", () => {
  it("chamado suspenso mostra Retomar no lugar do seletor e volta para Em andamento", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    ticketService.retomar.mockResolvedValue(chamado());
    renderizar();

    const retomar = await screen.findByRole("button", { name: "Retomar" });
    expect(screen.queryByRole("combobox", { name: /^Status/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();

    fireEvent.click(retomar);

    await waitFor(() => expect(ticketService.retomar).toHaveBeenCalledWith("7"));
    expect(notificar).toHaveBeenCalledWith("Chamado retomado");
  });
});

describe("TicketDetalhe: setor", () => {
  it("mostra o setor do chamado", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ departamento: { id: 2, nome: "Financeiro" } }));
    renderizar();

    expect(await screen.findByText("Setor: Financeiro")).toBeInTheDocument();
  });

  it("chamado antigo sem setor mostra 'Não informado'", async () => {
    ticketService.buscar.mockResolvedValue(chamado({ departamento: null }));
    renderizar();

    expect(await screen.findByText("Setor: Não informado")).toBeInTheDocument();
  });
});

describe("TicketDetalhe: solicitante", () => {
  it("não vê as ações de suspender nem retomar", async () => {
    usuarioLogado = SOLICITANTE;
    ticketService.buscar.mockResolvedValue(chamado({ status: "SUSPENSO" }));
    renderizar();

    expect(await screen.findByText("VPN não conecta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retomar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
  });
});

describe("TicketDetalhe: aprovação do gestor", () => {
  const pendente = (extra = {}) => chamado({ status: "ABERTO", tecnico: null, aprovacaoStatus: "PENDENTE", ...extra });

  it("mostra o aviso de aprovação pendente e esconde os controles da equipe", async () => {
    usuarioLogado = TECNICO;
    ticketService.buscar.mockResolvedValue(pendente());
    renderizar();

    expect(await screen.findByText(/aguarda a aprovação do gestor/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  });

  it("o gestor aprova e o chamado é recarregado", async () => {
    usuarioLogado = GESTOR;
    ticketService.buscar.mockResolvedValue(pendente());
    ticketService.aprovar.mockResolvedValue(chamado({ aprovacaoStatus: "APROVADA" }));
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Aprovar" }));

    await waitFor(() => expect(ticketService.aprovar).toHaveBeenCalledWith("7"));
    expect(notificar).toHaveBeenCalledWith("Chamado aprovado");
    await waitFor(() => expect(ticketService.buscar).toHaveBeenCalledTimes(2));
  });

  it("rejeitar exige o motivo e envia o texto informado", async () => {
    usuarioLogado = GESTOR;
    ticketService.buscar.mockResolvedValue(pendente());
    ticketService.rejeitar.mockResolvedValue(chamado({ aprovacaoStatus: "REJEITADA" }));
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Rejeitar" }));
    const confirmar = screen.getByRole("button", { name: "Confirmar rejeição" });
    expect(confirmar).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Motivo da rejeição"), { target: { value: " sem verba " } });
    fireEvent.click(confirmar);

    await waitFor(() => expect(ticketService.rejeitar).toHaveBeenCalledWith("7", "sem verba"));
    expect(notificar).toHaveBeenCalledWith("Chamado rejeitado");
  });

  it("mostra o erro do servidor quando o gestor não é do setor", async () => {
    usuarioLogado = GESTOR;
    ticketService.buscar.mockResolvedValue(pendente());
    ticketService.aprovar.mockRejectedValue({ response: { data: { erro: "Só o gestor do setor do chamado pode decidir a aprovação" } } });
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Aprovar" }));

    await waitFor(() =>
      expect(notificar).toHaveBeenCalledWith("Só o gestor do setor do chamado pode decidir a aprovação", "erro")
    );
  });

  it("chamado rejeitado mostra quem rejeitou e o motivo", async () => {
    usuarioLogado = SOLICITANTE;
    ticketService.buscar.mockResolvedValue(
      chamado({ status: "FECHADO", aprovacaoStatus: "REJEITADA", aprovacaoMotivo: "sem verba", aprovador: { nome: "Gê" } })
    );
    renderizar();

    expect(await screen.findByText(/Rejeitado por Gê\. Motivo: sem verba/)).toBeInTheDocument();
  });
});

describe("TicketDetalhe: formulário do assunto", () => {
  it("mostra as respostas gravadas no chamado", async () => {
    usuarioLogado = TECNICO;
    ticketService.buscar.mockResolvedValue(
      chamado({
        assunto: { id: 8, nome: "Novo acesso" },
        respostasFormulario: [
          { campoId: 1, rotulo: "Sistema", tipo: "SELECAO", valor: "ERP" },
          { campoId: 2, rotulo: "Desde quando?", tipo: "DATA", valor: "2026-11-20" },
          { campoId: 3, rotulo: "Liga?", tipo: "CHECKBOX", valor: false },
        ],
      })
    );
    renderizar();

    const secao = await screen.findByRole("region", { name: "Dados do formulário" });
    expect(within(secao).getByText("ERP")).toBeInTheDocument();
    expect(within(secao).getByText("20/11/2026")).toBeInTheDocument();
    expect(within(secao).getByText("Não")).toBeInTheDocument();
    expect(within(secao).getByText(/Novo acesso/)).toBeInTheDocument();
  });

  it("chamado sem formulário não mostra a seção", async () => {
    usuarioLogado = TECNICO;
    ticketService.buscar.mockResolvedValue(chamado());
    renderizar();

    await screen.findByText("VPN não conecta");
    expect(screen.queryByRole("region", { name: "Dados do formulário" })).not.toBeInTheDocument();
  });
});

