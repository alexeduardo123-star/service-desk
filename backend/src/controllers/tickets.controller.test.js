import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    ticket: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    ticketColaborador: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    assunto: { findUnique: vi.fn() },
    categoria: { findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
    comentario: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../utils/eventosTicket.js", async (original) => ({
  // Mantém as regras puras de verdade e só espiona os avisos, que vão ao banco.
  ...(await original()),
  avisarTicketSuspenso: vi.fn(),
  avisarTicketAtribuido: vi.fn(),
  avisarTicketEncaminhado: vi.fn(),
  avisarColaboradorAdicionado: vi.fn(),
  avisarTicketRetomado: vi.fn(),
  avisarTicketCriado: vi.fn(),
  avisarAprovacaoPendente: vi.fn(),
  avisarAprovacaoDecidida: vi.fn(),
}));

const prisma = (await import("../config/prisma.js")).default;
const eventos = await import("../utils/eventosTicket.js");
const {
  criar,
  buscar,
  listar,
  suspender,
  retomar,
  alterarStatus,
  atribuir,
  encaminhar,
  aprovar,
  rejeitar,
  listarColaboradores,
  adicionarColaborador,
  removerColaborador,
} = await import("./tickets.controller.js");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const TICKET = { id: 7, titulo: "VPN", status: "EM_ANDAMENTO", solicitanteId: 10, tecnicoId: 20 };

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

function req(body = {}) {
  return { params: { id: "7" }, body, user: TECNICO };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction recebe as operações já montadas; devolve o resultado de cada uma.
  prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
  prisma.ticket.update.mockImplementation(({ data }) => Promise.resolve({ ...TICKET, ...data }));
  prisma.comentario.create.mockResolvedValue({ id: 1 });
  prisma.categoria.findUnique.mockResolvedValue({ exigeAprovacao: false });
  prisma.ticketColaborador.deleteMany.mockResolvedValue({ count: 0 });
});

describe("tickets.controller: suspender", () => {
  it("muda para SUSPENSO e registra o motivo como comentário, na mesma transação", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);
    const res = mockRes();

    await suspender(req({ motivo: "aguardando peça" }), res, throwingNext);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 }, data: { status: "SUSPENSO" } }));
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 20, mensagem: "Chamado suspenso. Motivo: aguardando peça" },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "SUSPENSO" }));
  });

  it("avisa o solicitante com o motivo", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);

    await suspender(req({ motivo: "aguardando peça" }), mockRes(), throwingNext);

    expect(eventos.avisarTicketSuspenso).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, status: "SUSPENSO" }),
      TECNICO,
      "aguardando peça"
    );
  });

  it("recusa chamado fechado ou já suspenso sem mexer em nada", async () => {
    for (const status of ["FECHADO", "SUSPENSO"]) {
      prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, status });
      const res = mockRes();

      await suspender(req({ motivo: "x" }), res, throwingNext);

      expect(res.status).toHaveBeenCalledWith(409);
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.comentario.create).not.toHaveBeenCalled();
    expect(eventos.avisarTicketSuspenso).not.toHaveBeenCalled();
  });

  it("404 quando o chamado não existe", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await suspender(req({ motivo: "x" }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("tickets.controller: retomar", () => {
  it("volta o chamado suspenso para EM_ANDAMENTO e avisa o solicitante", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, status: "SUSPENSO" });
    const res = mockRes();

    await retomar(req(), res, throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 }, data: { status: "EM_ANDAMENTO" } }));
    expect(eventos.avisarTicketRetomado).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "EM_ANDAMENTO" }), TECNICO);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "EM_ANDAMENTO" }));
  });

  it("recusa retomar chamado que não está suspenso", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);
    const res = mockRes();

    await retomar(req(), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
    expect(eventos.avisarTicketRetomado).not.toHaveBeenCalled();
  });
});

describe("tickets.controller: encaminhar", () => {
  const BRUNO = { id: 21, nome: "Bruno", papel: "TECNICO", ativo: true };
  const COM_TECNICO = { ...TICKET, tecnico: { id: 20, nome: "Téc" } };

  it("troca o atendente e registra o motivo como comentário, na mesma transação", async () => {
    prisma.ticket.findUnique.mockResolvedValue(COM_TECNICO);
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);
    const res = mockRes();

    await encaminhar(req({ tecnicoId: 21, motivo: "especialista em rede" }), res, throwingNext);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { tecnicoId: 21, status: "EM_ANDAMENTO" } })
    );
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 20, mensagem: "Chamado encaminhado de Téc para Bruno. Motivo: especialista em rede" },
    });
    expect(eventos.avisarTicketEncaminhado).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, tecnicoId: 21 }),
      TECNICO,
      { anteriorId: 20, motivo: "especialista em rede" }
    );
    expect(eventos.avisarTicketAtribuido).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ tecnicoId: 21 }));
  });

  it("chamado aberto sem atendente passa para Em andamento", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, status: "ABERTO", tecnicoId: null, tecnico: null });
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);

    await encaminhar(req({ tecnicoId: 21, motivo: "fila da manhã" }), mockRes(), throwingNext);

    expect(prisma.ticket.update.mock.calls[0][0].data).toEqual({ tecnicoId: 21, status: "EM_ANDAMENTO" });
    expect(prisma.comentario.create.mock.calls[0][0].data.mensagem).toBe(
      "Chamado encaminhado de sem atendente para Bruno. Motivo: fila da manhã"
    );
  });

  it("chamado suspenso continua suspenso", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...COM_TECNICO, status: "SUSPENSO" });
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);

    await encaminhar(req({ tecnicoId: 21, motivo: "troca de turno" }), mockRes(), throwingNext);

    expect(prisma.ticket.update.mock.calls[0][0].data.status).toBe("SUSPENSO");
  });

  it("recusa com 409 quando a regra não deixa (fechado, mesmo atendente, destino inválido)", async () => {
    const casos = [
      [{ ...COM_TECNICO, status: "FECHADO" }, BRUNO, "Chamado fechado não pode ser encaminhado"],
      [COM_TECNICO, { ...BRUNO, id: 20 }, "O chamado já está com este atendente"],
      [COM_TECNICO, { ...BRUNO, papel: "SOLICITANTE" }, "O destino precisa ser um atendente ativo"],
      [COM_TECNICO, null, "O destino precisa ser um atendente ativo"],
    ];
    for (const [ticket, destino, mensagem] of casos) {
      prisma.ticket.findUnique.mockResolvedValue(ticket);
      prisma.usuario.findUnique.mockResolvedValue(destino);
      const res = mockRes();

      await encaminhar(req({ tecnicoId: destino?.id ?? 99, motivo: "algum motivo" }), res, throwingNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ erro: mensagem });
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(eventos.avisarTicketEncaminhado).not.toHaveBeenCalled();
  });

  it("respeita a aprovação pendente do gestor", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...COM_TECNICO, aprovacaoStatus: "PENDENTE" });
    const res = mockRes();

    await encaminhar(req({ tecnicoId: 21, motivo: "algum motivo" }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ erro: "Chamado aguardando aprovação do gestor" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("404 quando o chamado não existe", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await encaminhar(req({ tecnicoId: 21, motivo: "algum motivo" }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("se o destino era colaborador, sai da lista na mesma transação", async () => {
    prisma.ticket.findUnique.mockResolvedValue(COM_TECNICO);
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);

    await encaminhar(req({ tecnicoId: 21, motivo: "especialista em rede" }), mockRes(), throwingNext);

    expect(prisma.ticketColaborador.deleteMany).toHaveBeenCalledWith({ where: { ticketId: 7, usuarioId: 21 } });
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(3);
  });
});

describe("tickets.controller: colaboradores", () => {
  const BRUNO = { id: 21, nome: "Bruno", papel: "TECNICO", ativo: true };
  const reqColab = ({ params = {}, body = {} } = {}) => ({ params: { id: 7, ...params }, body, user: TECNICO });
  const LISTA = [{ usuario: { id: 21, nome: "Bruno" } }];

  beforeEach(() => {
    prisma.ticketColaborador.findMany.mockResolvedValue(LISTA);
    prisma.ticketColaborador.create.mockResolvedValue({ id: 1 });
    prisma.ticketColaborador.delete.mockResolvedValue({ id: 1 });
  });

  it("buscar e listar devolvem os colaboradores só com id e nome", async () => {
    const comColab = { ...TICKET, colaboradores: [{ usuario: { id: 21, nome: "Bruno" } }], comentarios: [] };
    prisma.ticket.findUnique.mockResolvedValue(comColab);
    prisma.ticket.findMany.mockResolvedValue([comColab]);
    const resBuscar = mockRes();
    const resListar = mockRes();

    await buscar(req(), resBuscar, throwingNext);
    await listar({ query: {}, user: TECNICO }, resListar, throwingNext);

    expect(prisma.ticket.findUnique.mock.calls[0][0].include.colaboradores).toBeDefined();
    expect(prisma.ticket.findMany.mock.calls[0][0].include.colaboradores).toBeDefined();
    expect(resBuscar.json.mock.calls[0][0].colaboradores).toEqual([{ id: 21, nome: "Bruno" }]);
    expect(resListar.json.mock.calls[0][0][0].colaboradores).toEqual([{ id: 21, nome: "Bruno" }]);
  });

  it("lista os colaboradores do chamado", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 7 });
    const res = mockRes();

    await listarColaboradores(reqColab(), res, throwingNext);

    expect(res.json).toHaveBeenCalledWith([{ id: 21, nome: "Bruno" }]);
  });

  it("listar colaboradores de chamado inexistente dá 404", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await listarColaboradores(reqColab(), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("adiciona, registra no histórico na mesma transação e devolve a lista", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, colaboradores: [] });
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);
    const res = mockRes();

    await adicionarColaborador(reqColab({ body: { usuarioId: 21 } }), res, throwingNext);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ticketColaborador.create).toHaveBeenCalledWith({ data: { ticketId: 7, usuarioId: 21, adicionadoPorId: 20 } });
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 20, mensagem: "Téc adicionou Bruno como colaborador" },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith([{ id: 21, nome: "Bruno" }]);
    expect(eventos.avisarColaboradorAdicionado).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }), TECNICO, 21);
  });

  it("recusa com 409 quando a regra não deixa adicionar", async () => {
    const casos = [
      [{ ...TICKET, status: "FECHADO", colaboradores: [] }, BRUNO, "Chamado fechado não aceita mudanças nos colaboradores"],
      [{ ...TICKET, colaboradores: [{ usuarioId: 21 }] }, BRUNO, "Este usuário já é colaborador do chamado"],
      [{ ...TICKET, colaboradores: [] }, { ...BRUNO, id: 20 }, "O atendente responsável não pode ser colaborador"],
      [{ ...TICKET, colaboradores: [] }, { ...BRUNO, id: 10 }, "O solicitante do chamado não pode ser colaborador"],
      [{ ...TICKET, colaboradores: [] }, { ...BRUNO, ativo: false }, "Usuário inativo não pode ser colaborador"],
    ];
    for (const [ticket, usuario, mensagem] of casos) {
      prisma.ticket.findUnique.mockResolvedValue(ticket);
      prisma.usuario.findUnique.mockResolvedValue(usuario);
      const res = mockRes();

      await adicionarColaborador(reqColab({ body: { usuarioId: usuario.id } }), res, throwingNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ erro: mensagem });
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(eventos.avisarColaboradorAdicionado).not.toHaveBeenCalled();
  });

  it("404 para chamado ou usuário inexistente ao adicionar", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const semChamado = mockRes();
    await adicionarColaborador(reqColab({ body: { usuarioId: 21 } }), semChamado, throwingNext);
    expect(semChamado.status).toHaveBeenCalledWith(404);

    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, colaboradores: [] });
    prisma.usuario.findUnique.mockResolvedValue(null);
    const semUsuario = mockRes();
    await adicionarColaborador(reqColab({ body: { usuarioId: 99 } }), semUsuario, throwingNext);
    expect(semUsuario.status).toHaveBeenCalledWith(404);
    expect(semUsuario.json).toHaveBeenCalledWith({ erro: "Usuário não encontrado" });
  });

  it("remove, registra no histórico na mesma transação e devolve a lista", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 7, status: "EM_ANDAMENTO" });
    prisma.ticketColaborador.findUnique.mockResolvedValue({ id: 5, usuario: { id: 21, nome: "Bruno" } });
    prisma.ticketColaborador.findMany.mockResolvedValue([]);
    const res = mockRes();

    await removerColaborador(reqColab({ params: { usuarioId: 21 } }), res, throwingNext);

    expect(prisma.ticketColaborador.findUnique.mock.calls[0][0].where).toEqual({ ticketId_usuarioId: { ticketId: 7, usuarioId: 21 } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ticketColaborador.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 20, mensagem: "Téc removeu Bruno dos colaboradores" },
    });
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("não remove de chamado fechado", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 7, status: "FECHADO" });
    const res = mockRes();

    await removerColaborador(reqColab({ params: { usuarioId: 21 } }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("aprovação pendente do gestor trava adicionar e remover", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, aprovacaoStatus: "PENDENTE", colaboradores: [] });
    prisma.usuario.findUnique.mockResolvedValue(BRUNO);
    const resAdicionar = mockRes();
    const resRemover = mockRes();

    await adicionarColaborador(reqColab({ body: { usuarioId: 21 } }), resAdicionar, throwingNext);
    await removerColaborador(reqColab({ params: { usuarioId: 21 } }), resRemover, throwingNext);

    for (const res of [resAdicionar, resRemover]) {
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ erro: "Chamado aguardando aprovação do gestor" });
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("404 ao remover quem não é colaborador", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 7, status: "EM_ANDAMENTO" });
    prisma.ticketColaborador.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await removerColaborador(reqColab({ params: { usuarioId: 21 } }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: "Este usuário não é colaborador do chamado" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("atribuir também tira o novo responsável dos colaboradores", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, aprovacaoStatus: "NAO_EXIGIDA" });

    await atribuir(req({ tecnicoId: 21 }), mockRes(), throwingNext);

    expect(prisma.ticketColaborador.deleteMany).toHaveBeenCalledWith({ where: { ticketId: 7, usuarioId: 21 } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("tickets.controller: criar com setor", () => {
  const NOVO = { titulo: "Impressora", descricao: "Não imprime", categoriaId: 1, prioridadeId: 2 };

  beforeEach(() => {
    prisma.ticket.create.mockImplementation(({ data }) => Promise.resolve({ id: 9, ...data }));
  });

  it("grava o setor escolhido e devolve o chamado com o setor", async () => {
    const res = mockRes();

    await criar({ body: { ...NOVO, departamentoId: 4 }, user: TECNICO }, res, throwingNext);

    const { data, include } = prisma.ticket.create.mock.calls[0][0];
    expect(data).toMatchObject({ departamentoId: 4, solicitanteId: 20 });
    expect(include.departamento).toBe(true);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("sem setor informado grava null (chamados abertos fora da tela)", async () => {
    await criar({ body: NOVO, user: TECNICO }, mockRes(), throwingNext);

    expect(prisma.ticket.create.mock.calls[0][0].data.departamentoId).toBeNull();
  });
});

describe("tickets.controller: criar com assunto", () => {
  const NOVO = { titulo: "VPN", descricao: "Não conecta", categoriaId: 1, prioridadeId: 2, assuntoId: 5 };

  beforeEach(() => {
    prisma.ticket.create.mockImplementation(async ({ data }) => ({ id: 50, ...data }));
  });

  it("usa a prioridade cadastrada no assunto, ignorando a enviada", async () => {
    prisma.assunto.findUnique.mockResolvedValue({ id: 5, ativo: true, prioridadeId: 4 });
    const res = mockRes();

    await criar({ body: NOVO, user: TECNICO }, res, throwingNext);

    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ prioridadeId: 4, assuntoId: 5 }) })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("se o assunto não tem prioridade (cadastro antigo), usa a informada", async () => {
    prisma.assunto.findUnique.mockResolvedValue({ id: 5, ativo: true, prioridadeId: null });

    await criar({ body: NOVO, user: TECNICO }, mockRes(), throwingNext);

    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ prioridadeId: 2, assuntoId: 5 }) })
    );
  });

  it("recusa assunto inexistente ou inativo", async () => {
    for (const assunto of [null, { id: 5, ativo: false, prioridadeId: 4 }]) {
      prisma.assunto.findUnique.mockResolvedValue(assunto);
      const res = mockRes();

      await criar({ body: NOVO, user: TECNICO }, res, throwingNext);

      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("sem assunto continua exigindo a prioridade", async () => {
    const res = mockRes();

    await criar({ body: { titulo: "x", descricao: "y", categoriaId: 1 }, user: TECNICO }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("sem assunto grava assuntoId null e mantém a prioridade informada", async () => {
    await criar({ body: { ...NOVO, assuntoId: undefined }, user: TECNICO }, mockRes(), throwingNext);

    expect(prisma.assunto.findUnique).not.toHaveBeenCalled();
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ prioridadeId: 2, assuntoId: null }) })
    );
  });
});

describe("tickets.controller: aprovação do gestor", () => {
  const GESTOR = { id: 30, nome: "Gê", papel: "GESTOR" };
  const PENDENTE = {
    ...TICKET,
    status: "ABERTO",
    tecnicoId: null,
    departamentoId: 3,
    aprovacaoStatus: "PENDENTE",
    solicitante: { id: 10, nome: "Ana" },
  };
  const reqGestor = (body = {}) => ({ params: { id: "7" }, body, user: GESTOR });

  it("categoria que exige aprovação cria o chamado pendente e avisa só os gestores", async () => {
    prisma.categoria.findUnique.mockResolvedValue({ exigeAprovacao: true });
    prisma.ticket.create.mockImplementation(({ data }) => Promise.resolve({ id: 9, ...data }));
    const res = mockRes();

    await criar({ body: { titulo: "Notebook", descricao: "Novo", categoriaId: 8, prioridadeId: 2, departamentoId: 3 }, user: TECNICO }, res, throwingNext);

    expect(prisma.ticket.create.mock.calls[0][0].data.aprovacaoStatus).toBe("PENDENTE");
    expect(eventos.avisarAprovacaoPendente).toHaveBeenCalledTimes(1);
    expect(eventos.avisarTicketCriado).not.toHaveBeenCalled();
  });

  it("categoria comum cria como NAO_EXIGIDA e avisa a equipe", async () => {
    prisma.ticket.create.mockImplementation(({ data }) => Promise.resolve({ id: 9, ...data }));

    await criar({ body: { titulo: "x", descricao: "y", categoriaId: 1, prioridadeId: 2 }, user: TECNICO }, mockRes(), throwingNext);

    expect(prisma.ticket.create.mock.calls[0][0].data.aprovacaoStatus).toBe("NAO_EXIGIDA");
    expect(eventos.avisarTicketCriado).toHaveBeenCalledTimes(1);
    expect(eventos.avisarAprovacaoPendente).not.toHaveBeenCalled();
  });

  it("enquanto pendente, bloqueia status, atribuição, suspensão e retomada", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    const chamadas = [
      () => alterarStatus(req({ status: "EM_ANDAMENTO" }), mockRes(), throwingNext),
      () => atribuir(req({ tecnicoId: 20 }), mockRes(), throwingNext),
      () => suspender(req({ motivo: "x" }), mockRes(), throwingNext),
      () => retomar(req(), mockRes(), throwingNext),
    ];
    for (const chamar of chamadas) await chamar();

    expect(prisma.ticket.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("alterarStatus devolve 409 e a mensagem quando pendente", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    const res = mockRes();

    await alterarStatus(req({ status: "EM_ANDAMENTO" }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ erro: "Chamado aguardando aprovação do gestor" });
  });

  it("alterarStatus e atribuir seguem normais quando não há aprovação pendente", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, aprovacaoStatus: "APROVADA" });

    await alterarStatus(req({ status: "FECHADO" }), mockRes(), throwingNext);
    await atribuir(req({ tecnicoId: 21 }), mockRes(), throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledTimes(2);
  });

  it("gestor do setor aprova: grava aprovador, comenta e avisa solicitante e equipe", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    prisma.usuario.findUnique.mockResolvedValue({ papel: "GESTOR", departamentoId: 3 });
    prisma.ticket.update.mockImplementation(({ data }) => Promise.resolve({ ...PENDENTE, ...data }));
    const res = mockRes();

    await aprovar(reqGestor(), res, throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({ aprovacaoStatus: "APROVADA", aprovadorId: 30 }),
      })
    );
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 30, mensagem: "Chamado aprovado por Gê." },
    });
    expect(eventos.avisarAprovacaoDecidida).toHaveBeenCalledWith(expect.anything(), GESTOR, true);
    expect(eventos.avisarTicketCriado).toHaveBeenCalledWith(expect.anything(), { id: 10, nome: "Ana" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("gestor de outro setor não decide (403) e nada é gravado", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    prisma.usuario.findUnique.mockResolvedValue({ papel: "GESTOR", departamentoId: 9 });
    const res = mockRes();

    await aprovar(reqGestor(), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("ADMIN decide chamado de qualquer setor", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    prisma.usuario.findUnique.mockResolvedValue({ papel: "ADMIN", departamentoId: null });

    await aprovar({ params: { id: "7" }, body: {}, user: { id: 1, nome: "Adm", papel: "ADMIN" } }, mockRes(), throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledTimes(1);
  });

  it("não decide chamado que não está pendente (409) nem inexistente (404)", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...PENDENTE, aprovacaoStatus: "APROVADA" });
    const res = mockRes();
    await aprovar(reqGestor(), res, throwingNext);
    expect(res.status).toHaveBeenCalledWith(409);

    prisma.ticket.findUnique.mockResolvedValue(null);
    const res2 = mockRes();
    await rejeitar(reqGestor({ motivo: "x" }), res2, throwingNext);
    expect(res2.status).toHaveBeenCalledWith(404);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("rejeitar fecha o chamado, guarda o motivo e avisa o solicitante", async () => {
    prisma.ticket.findUnique.mockResolvedValue(PENDENTE);
    prisma.usuario.findUnique.mockResolvedValue({ papel: "GESTOR", departamentoId: 3 });
    const res = mockRes();

    await rejeitar(reqGestor({ motivo: "sem verba" }), res, throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aprovacaoStatus: "REJEITADA",
          aprovacaoMotivo: "sem verba",
          status: "FECHADO",
          closedAt: expect.any(Date),
        }),
      })
    );
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 30, mensagem: "Chamado rejeitado por Gê. Motivo: sem verba" },
    });
    expect(eventos.avisarAprovacaoDecidida).toHaveBeenCalledWith(expect.anything(), GESTOR, false, "sem verba");
    expect(eventos.avisarTicketCriado).not.toHaveBeenCalled();
  });
});

describe("tickets.controller: formulário do assunto", () => {
  const CAMPOS = [
    { id: 1, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] },
    { id: 2, rotulo: "Justificativa", tipo: "TEXTO", obrigatorio: false, opcoes: [] },
  ];
  const NOVO = { titulo: "Acesso", descricao: "Preciso", categoriaId: 1, prioridadeId: 2, assuntoId: 5 };

  beforeEach(() => {
    prisma.ticket.create.mockImplementation(async ({ data }) => ({ id: 60, ...data }));
  });

  it("grava as respostas validadas junto com o chamado", async () => {
    prisma.assunto.findUnique.mockResolvedValue({ id: 5, ativo: true, prioridadeId: 4, formulario: { ativo: true, campos: CAMPOS } });

    await criar({ body: { ...NOVO, respostas: { 1: "ERP", 2: "  urgente " } }, user: TECNICO }, mockRes(), throwingNext);

    expect(prisma.ticket.create.mock.calls[0][0].data.respostasFormulario).toEqual([
      { campoId: 1, rotulo: "Sistema", tipo: "SELECAO", valor: "ERP" },
      { campoId: 2, rotulo: "Justificativa", tipo: "TEXTO", valor: "urgente" },
    ]);
  });

  it("recusa (400) quando falta campo obrigatório e não cria o chamado", async () => {
    prisma.assunto.findUnique.mockResolvedValue({ id: 5, ativo: true, prioridadeId: 4, formulario: { ativo: true, campos: CAMPOS } });
    const res = mockRes();

    await criar({ body: { ...NOVO, respostas: { 2: "x" } }, user: TECNICO }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Preencha o campo "Sistema"' });
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("assunto sem formulário (ou com formulário inativo) não guarda respostas", async () => {
    for (const formulario of [null, { ativo: false, campos: CAMPOS }]) {
      prisma.assunto.findUnique.mockResolvedValue({ id: 5, ativo: true, prioridadeId: 4, formulario });
      prisma.ticket.create.mockClear();

      await criar({ body: { ...NOVO, respostas: { 1: "ERP" } }, user: TECNICO }, mockRes(), throwingNext);

      expect(prisma.ticket.create.mock.calls[0][0].data.respostasFormulario).toBeUndefined();
    }
  });
});

