import { describe, it, expect, vi } from "vitest";
import {
  avisarAprovacaoDecidida,
  avisarColaboradorAdicionado,
  avisarComentario,
  avisarTicketEncaminhado,
  envolvidosDoChamado,
  mensagensDeEncaminhamento,
  destinatariosDoComentario,
  avisarStatusAlterado,
  avisarTicketCriado,
  avisarRetomadaDeAtendimento,
  avisarTicketSuspenso,
  avisarTicketRetomado,
  comentarioDeEncaminhamento,
  comentarioDeSuspensao,
  deveRetomarAtendimento,
  erroAoEncaminhar,
  erroAoRetomar,
  erroAoSuspender,
  statusAoEncaminhar,
} from "./eventosTicket.js";

const TICKET = { id: 7, titulo: "Notebook não liga", solicitanteId: 10, tecnicoId: 20, status: "FECHADO" };

function depsFalsas({ usuarios = {}, equipe = [], colaboradores = [] } = {}) {
  return {
    prisma: {
      usuario: {
        findUnique: vi.fn(({ where }) => Promise.resolve(usuarios[where.id] ?? null)),
        findMany: vi.fn().mockResolvedValue(equipe),
      },
      ticketColaborador: {
        findMany: vi.fn().mockResolvedValue(colaboradores.map((usuario) => ({ usuario }))),
      },
      configuracaoUsuario: { findMany: vi.fn().mockResolvedValue([]) },
      notificacao: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    },
    enviarEmail: vi.fn().mockResolvedValue(undefined),
  };
}

describe("destinatariosDoComentario", () => {
  it("solicitante comenta: avisa o técnico responsável", () => {
    const r = destinatariosDoComentario(TICKET, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [20], incluirEquipe: false });
  });

  it("solicitante comenta em chamado sem técnico: avisa a equipe", () => {
    const r = destinatariosDoComentario({ ...TICKET, tecnicoId: null }, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [], incluirEquipe: true });
  });

  it("técnico comenta: avisa o solicitante e não a si mesmo", () => {
    const r = destinatariosDoComentario(TICKET, { id: 20, papel: "TECNICO" });
    expect(r).toEqual({ ids: [10], incluirEquipe: false });
  });

  it("admin comenta: avisa solicitante e técnico", () => {
    const r = destinatariosDoComentario(TICKET, { id: 1, papel: "ADMIN" });
    expect(r.ids.sort()).toEqual([10, 20]);
  });
});

describe("avisarStatusAlterado", () => {
  it("notifica o solicitante com o status em português", async () => {
    const deps = depsFalsas({ usuarios: { 10: { id: 10, nome: "Ana", email: "a@a.com", ativo: true } } });
    await avisarStatusAlterado(TICKET, { id: 20, nome: "Téc" }, deps);
    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data[0];
    expect(data.usuarioId).toBe(10);
    expect(data.tipo).toBe("TICKET_STATUS");
    expect(data.titulo).toContain("Fechado");
  });

  it("não notifica quando o próprio solicitante é quem alterou", async () => {
    const deps = depsFalsas({ usuarios: { 10: { id: 10, nome: "Ana", ativo: true } } });
    await avisarStatusAlterado(TICKET, { id: 10, nome: "Ana" }, deps);
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

describe("avisarTicketCriado", () => {
  it("avisa a equipe, menos quem abriu o chamado", async () => {
    const deps = depsFalsas({ equipe: [{ id: 1, ativo: true }, { id: 2, ativo: true }] });
    await avisarTicketCriado({ id: 7, titulo: "X" }, { id: 1, nome: "Admin" }, deps);
    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data.map((n) => n.usuarioId)).toEqual([2]);
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findMany = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = console.error;
    console.error = () => {};
    await avisarTicketCriado({ id: 7, titulo: "X" }, { id: 1, nome: "Admin" }, deps);
    console.error = spy;
    expect(true).toBe(true);
  });
});

const AGUARDANDO = { ...TICKET, status: "AGUARDANDO_USUARIO" };

describe("deveRetomarAtendimento", () => {
  it("solicitante responde no chamado em espera: retoma", () => {
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 10, papel: "SOLICITANTE" })).toBe(true);
  });

  it("comentário do técnico ou do admin não tira o chamado da espera", () => {
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 20, papel: "TECNICO" })).toBe(false);
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 1, papel: "ADMIN" })).toBe(false);
  });

  it("não retoma chamado que não está aguardando o usuário", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "FECHADO"]) {
      expect(deveRetomarAtendimento({ ...TICKET, status }, { id: 10, papel: "SOLICITANTE" })).toBe(false);
    }
  });
});

describe("avisarRetomadaDeAtendimento", () => {
  it("avisa o técnico responsável que o usuário respondeu", async () => {
    const deps = depsFalsas({ usuarios: { 20: { id: 20, nome: "Téc", email: "t@t.com", ativo: true } } });

    await avisarRetomadaDeAtendimento({ ...AGUARDANDO, status: "EM_ANDAMENTO" }, { id: 10, nome: "Ana" }, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data[0];
    expect(data.usuarioId).toBe(20);
    expect(data.tipo).toBe("TICKET_STATUS");
    expect(data.titulo).toContain("Em andamento");
    expect(data.mensagem).toContain("Ana");
    expect(data.ticketId).toBe(7);
  });

  it("sem técnico responsável, avisa a equipe", async () => {
    const deps = depsFalsas({ equipe: [{ id: 1, ativo: true }, { id: 2, ativo: true }] });

    await avisarRetomadaDeAtendimento({ ...AGUARDANDO, tecnicoId: null }, { id: 10, nome: "Ana" }, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data.map((n) => n.usuarioId)).toEqual([1, 2]);
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findUnique = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = console.error;
    console.error = () => {};
    await avisarRetomadaDeAtendimento(AGUARDANDO, { id: 10, nome: "Ana" }, deps);
    console.error = spy;
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

const ANA = { 10: { id: 10, nome: "Ana", email: "a@a.com", ativo: true } };
const SUSPENSO = { ...TICKET, status: "SUSPENSO" };

describe("regras de suspensão", () => {
  it("suspende chamado aberto, em andamento ou aguardando o usuário", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO"]) {
      expect(erroAoSuspender({ ...TICKET, status })).toBeNull();
    }
  });

  it("não suspende chamado fechado nem um já suspenso", () => {
    expect(erroAoSuspender(TICKET)).toBe("Chamado fechado não pode ser suspenso");
    expect(erroAoSuspender(SUSPENSO)).toBe("O chamado já está suspenso");
  });

  it("só retoma chamado suspenso", () => {
    expect(erroAoRetomar(SUSPENSO)).toBeNull();
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "FECHADO"]) {
      expect(erroAoRetomar({ ...TICKET, status })).toBe("Só é possível retomar um chamado suspenso");
    }
  });

  it("o comentário de suspensão traz o motivo", () => {
    expect(comentarioDeSuspensao("aguardando peça")).toBe("Chamado suspenso. Motivo: aguardando peça");
  });
});

describe("avisarTicketSuspenso", () => {
  it("notifica o solicitante com o motivo", async () => {
    const deps = depsFalsas({ usuarios: ANA });

    await avisarTicketSuspenso(SUSPENSO, { id: 20, nome: "Téc" }, "aguardando peça", deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ usuarioId: 10, tipo: "TICKET_STATUS", ticketId: 7 });
    expect(data[0].titulo).toBe("Chamado #7: Suspenso");
    expect(data[0].mensagem).toContain("Téc");
    expect(data[0].mensagem).toContain("aguardando peça");
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findUnique = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = console.error;
    console.error = () => {};
    await avisarTicketSuspenso(SUSPENSO, { id: 20, nome: "Téc" }, "motivo", deps);
    console.error = spy;
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

describe("avisarTicketRetomado", () => {
  it("notifica o solicitante que o chamado voltou para Em andamento", async () => {
    const deps = depsFalsas({ usuarios: ANA });

    await avisarTicketRetomado({ ...TICKET, status: "EM_ANDAMENTO" }, { id: 1, nome: "Admin" }, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data[0];
    expect(data).toMatchObject({ usuarioId: 10, tipo: "TICKET_STATUS", ticketId: 7 });
    expect(data.titulo).toContain("Em andamento");
    expect(data.mensagem).toContain("Admin");
  });
});

describe("regras de encaminhamento", () => {
  const EM_ANDAMENTO = { ...TICKET, status: "EM_ANDAMENTO", tecnicoId: 20 };
  const BRUNO = { id: 21, nome: "Bruno", papel: "TECNICO", ativo: true };

  it("permite encaminhar para outro atendente ativo", () => {
    expect(erroAoEncaminhar(EM_ANDAMENTO, BRUNO)).toBeNull();
    expect(erroAoEncaminhar(EM_ANDAMENTO, { ...BRUNO, papel: "ADMIN" })).toBeNull();
    expect(erroAoEncaminhar({ ...EM_ANDAMENTO, tecnicoId: null, status: "ABERTO" }, BRUNO)).toBeNull();
  });

  it("vale para chamados suspensos ou aguardando o usuário", () => {
    for (const status of ["SUSPENSO", "AGUARDANDO_USUARIO"]) {
      expect(erroAoEncaminhar({ ...EM_ANDAMENTO, status }, BRUNO)).toBeNull();
    }
  });

  it("não encaminha chamado fechado", () => {
    expect(erroAoEncaminhar({ ...EM_ANDAMENTO, status: "FECHADO" }, BRUNO)).toBe("Chamado fechado não pode ser encaminhado");
  });

  it("não encaminha para o atendente atual", () => {
    expect(erroAoEncaminhar(EM_ANDAMENTO, { ...BRUNO, id: 20 })).toBe("O chamado já está com este atendente");
  });

  it("exige destino existente, ativo e que não seja solicitante", () => {
    const esperado = "O destino precisa ser um atendente ativo";
    expect(erroAoEncaminhar(EM_ANDAMENTO, null)).toBe(esperado);
    expect(erroAoEncaminhar(EM_ANDAMENTO, { ...BRUNO, ativo: false })).toBe(esperado);
    expect(erroAoEncaminhar(EM_ANDAMENTO, { ...BRUNO, papel: "SOLICITANTE" })).toBe(esperado);
  });

  it("chamado aberto passa para Em andamento; os demais mantêm o status", () => {
    expect(statusAoEncaminhar({ status: "ABERTO" })).toBe("EM_ANDAMENTO");
    for (const status of ["EM_ANDAMENTO", "AGUARDANDO_USUARIO", "SUSPENSO"]) {
      expect(statusAoEncaminhar({ status })).toBe(status);
    }
  });

  it("monta o comentário com o atendente anterior, o novo e o motivo", () => {
    expect(comentarioDeEncaminhamento({ nome: "Téc" }, BRUNO, "especialista em rede")).toBe(
      "Chamado encaminhado de Téc para Bruno. Motivo: especialista em rede"
    );
  });

  it("sem atendente anterior, o comentário diz que não havia atendente", () => {
    expect(comentarioDeEncaminhamento(null, BRUNO, "fila da manhã")).toBe(
      "Chamado encaminhado de sem atendente para Bruno. Motivo: fila da manhã"
    );
  });
});

// --- Envolvidos no chamado: solicitante (10), responsável (20) e colaboradores (30, 31).

const PESSOAS = {
  10: { id: 10, nome: "Ana", email: "ana@x.com", ativo: true },
  20: { id: 20, nome: "Téc", email: "tec@x.com", ativo: true },
  21: { id: 21, nome: "Bruno", email: "bruno@x.com", ativo: true },
  30: { id: 30, nome: "Carla", email: "carla@x.com", ativo: true },
  31: { id: 31, nome: "Davi", email: "davi@x.com", ativo: true },
};
const COLABORADORES = [PESSOAS[30], PESSOAS[31]];
const ABERTO = { ...TICKET, status: "EM_ANDAMENTO" };

// Ids de quem recebeu cada chamada de createMany, na ordem.
function notificados(deps) {
  return deps.prisma.notificacao.createMany.mock.calls.map((c) => c[0].data.map((n) => n.usuarioId));
}
const todosNotificados = (deps) => notificados(deps).flat().sort((a, b) => a - b);

describe("envolvidosDoChamado", () => {
  const pessoas = { solicitante: PESSOAS[10], tecnico: PESSOAS[20], colaboradores: COLABORADORES };

  it("solicitante, responsável e colaboradores, sem o autor", () => {
    expect(envolvidosDoChamado(pessoas, { id: 1 }).map((u) => u.id)).toEqual([10, 20, 30, 31]);
    expect(envolvidosDoChamado(pessoas, { id: 20 }).map((u) => u.id)).toEqual([10, 30, 31]);
    expect(envolvidosDoChamado(pessoas, { id: 30 }).map((u) => u.id)).toEqual([10, 20, 31]);
  });

  it("chamado antigo, sem responsável nem colaboradores", () => {
    expect(envolvidosDoChamado({ solicitante: PESSOAS[10], tecnico: null }, { id: 20 }).map((u) => u.id)).toEqual([10]);
  });

  it("tira repetidos e inativos", () => {
    const repetido = { solicitante: PESSOAS[10], tecnico: PESSOAS[20], colaboradores: [PESSOAS[20], { id: 40, ativo: false }] };
    expect(envolvidosDoChamado(repetido, { id: 1 }).map((u) => u.id)).toEqual([10, 20]);
  });

  it("sem pessoas carregadas não quebra", () => {
    expect(envolvidosDoChamado(null, { id: 1 })).toEqual([]);
  });
});

describe("destinatariosDoComentario com colaboradores", () => {
  const COM_COLAB = { ...ABERTO, colaboradores: [{ id: 30 }, { id: 31 }] };

  it("equipe comenta: solicitante, responsável e colaboradores, menos o autor", () => {
    expect(destinatariosDoComentario(COM_COLAB, { id: 20, papel: "TECNICO" })).toEqual({ ids: [10, 30, 31], incluirEquipe: false });
    expect(destinatariosDoComentario(COM_COLAB, { id: 30, papel: "TECNICO" })).toEqual({ ids: [10, 20, 31], incluirEquipe: false });
  });

  it("solicitante comenta: responsável e colaboradores", () => {
    expect(destinatariosDoComentario(COM_COLAB, { id: 10, papel: "SOLICITANTE" })).toEqual({ ids: [20, 30, 31], incluirEquipe: false });
  });

  it("solicitante comenta em chamado só com colaboradores: avisa eles, não a equipe", () => {
    const r = destinatariosDoComentario({ ...COM_COLAB, tecnicoId: null }, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [30, 31], incluirEquipe: false });
  });

  it("solicitante comenta e não há ninguém: avisa a equipe", () => {
    const r = destinatariosDoComentario({ ...ABERTO, tecnicoId: null, colaboradores: [] }, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [], incluirEquipe: true });
  });
});

describe("avisarComentario", () => {
  it("leva os colaboradores carregados do banco", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS, colaboradores: COLABORADORES });

    await avisarComentario(ABERTO, { id: 20, nome: "Téc", papel: "TECNICO" }, deps);

    expect(deps.prisma.ticketColaborador.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ticketId: 7 } }));
    expect(todosNotificados(deps)).toEqual([10, 30, 31]);
    expect(deps.prisma.notificacao.createMany.mock.calls[0][0].data[0].tipo).toBe("TICKET_COMENTARIO");
  });

  it("solicitante comenta e o responsável está inativo: cai para a equipe", async () => {
    const deps = depsFalsas({
      usuarios: { ...PESSOAS, 20: { ...PESSOAS[20], ativo: false } },
      equipe: [{ id: 1, ativo: true }],
    });

    await avisarComentario(ABERTO, { id: 10, nome: "Ana", papel: "SOLICITANTE" }, deps);

    expect(todosNotificados(deps)).toEqual([1]);
  });
});

describe("status, suspensão, retomada e aprovação avisam todos os envolvidos", () => {
  const TEC = { id: 20, nome: "Téc" };
  const casos = [
    ["mudança de status", (deps) => avisarStatusAlterado({ ...ABERTO, status: "FECHADO" }, TEC, deps), "TICKET_STATUS"],
    ["suspensão", (deps) => avisarTicketSuspenso({ ...ABERTO, status: "SUSPENSO" }, TEC, "peça", deps), "TICKET_STATUS"],
    ["retomada", (deps) => avisarTicketRetomado(ABERTO, TEC, deps), "TICKET_STATUS"],
    ["aprovação", (deps) => avisarAprovacaoDecidida(ABERTO, { id: 50, nome: "Gê" }, true, null, deps), "TICKET_APROVACAO"],
    ["rejeição", (deps) => avisarAprovacaoDecidida(ABERTO, { id: 50, nome: "Gê" }, false, "sem verba", deps), "TICKET_APROVACAO"],
  ];

  for (const [nome, avisar, tipo] of casos) {
    it(`${nome}: solicitante, responsável e colaboradores, menos o autor`, async () => {
      const deps = depsFalsas({ usuarios: PESSOAS, colaboradores: COLABORADORES });

      await avisar(deps);

      const esperado = nome.startsWith("apro") || nome === "rejeição" ? [10, 20, 30, 31] : [10, 30, 31];
      expect(todosNotificados(deps)).toEqual(esperado);
      expect(deps.prisma.notificacao.createMany.mock.calls[0][0].data.every((n) => n.tipo === tipo)).toBe(true);
    });
  }

  it("rejeição leva o motivo para todos", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS, colaboradores: COLABORADORES });

    await avisarAprovacaoDecidida(ABERTO, { id: 50, nome: "Gê" }, false, "sem verba", deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data.every((n) => n.mensagem === 'Gê rejeitou "Notebook não liga". Motivo: sem verba')).toBe(true);
  });

  it("retomada pelo solicitante (respondeu na espera) avisa responsável e colaboradores", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS, colaboradores: COLABORADORES });

    await avisarRetomadaDeAtendimento(ABERTO, { id: 10, nome: "Ana" }, deps);

    expect(todosNotificados(deps)).toEqual([20, 30, 31]);
  });

  it("falha ao buscar colaboradores não lança nem notifica pela metade", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });
    deps.prisma.ticketColaborador.findMany = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await avisarStatusAlterado(ABERTO, TEC, deps);

    spy.mockRestore();
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

describe("mensagensDeEncaminhamento", () => {
  it("monta os textos de cada grupo", () => {
    const m = mensagensDeEncaminhamento(TICKET, { nome: "Admin" }, { nome: "Bruno" }, "especialista em rede");
    expect(m.novo).toEqual({
      titulo: "Chamado #7 encaminhado para você",
      mensagem: 'Admin encaminhou "Notebook não liga" para você. Motivo: especialista em rede',
    });
    expect(m.anterior).toEqual({
      titulo: "Chamado #7 mudou de atendente",
      mensagem: 'Admin encaminhou "Notebook não liga" para Bruno. Motivo: especialista em rede',
    });
    expect(m.demais).toEqual({ titulo: "Chamado #7 mudou de atendente", mensagem: '"Notebook não liga" agora está com Bruno.' });
  });
});

describe("avisarTicketEncaminhado", () => {
  // Já depois da troca: o responsável agora é o Bruno (21); antes era o Téc (20).
  const ENCAMINHADO = { ...ABERTO, tecnicoId: 21 };
  const ADMIN = { id: 1, nome: "Admin" };

  function avisosPorPessoa(deps) {
    return Object.fromEntries(
      deps.prisma.notificacao.createMany.mock.calls.flatMap((c) => c[0].data.map((n) => [n.usuarioId, n]))
    );
  }

  it("novo atendente, atendente anterior e os demais recebem avisos diferentes", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS, colaboradores: COLABORADORES });

    await avisarTicketEncaminhado(ENCAMINHADO, ADMIN, { anteriorId: 20, motivo: "especialista em rede" }, deps);

    const avisos = avisosPorPessoa(deps);
    expect(Object.keys(avisos).map(Number).sort((a, b) => a - b)).toEqual([10, 20, 21, 30, 31]);
    expect(avisos[21]).toMatchObject({ tipo: "TICKET_ENCAMINHADO", ticketId: 7, titulo: "Chamado #7 encaminhado para você" });
    expect(avisos[21].mensagem).toContain("Motivo: especialista em rede");
    expect(avisos[20].titulo).toBe("Chamado #7 mudou de atendente");
    expect(avisos[20].mensagem).toContain("para Bruno. Motivo: especialista em rede");
    for (const id of [10, 30, 31]) {
      expect(avisos[id].mensagem).toBe('"Notebook não liga" agora está com Bruno.');
    }
  });

  it("sem atendente anterior, avisa só o novo e os demais", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });

    await avisarTicketEncaminhado(ENCAMINHADO, ADMIN, { anteriorId: null, motivo: "fila" }, deps);

    expect(notificados(deps)).toEqual([[21], [10]]);
  });

  it("quem encaminha o próprio chamado não é avisado", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });

    await avisarTicketEncaminhado(ENCAMINHADO, { id: 20, nome: "Téc" }, { anteriorId: 20, motivo: "troca de turno" }, deps);

    expect(todosNotificados(deps)).toEqual([10, 21]);
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findUnique = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await avisarTicketEncaminhado(ENCAMINHADO, ADMIN, { anteriorId: 20, motivo: "x" }, deps);

    spy.mockRestore();
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

describe("avisarColaboradorAdicionado", () => {
  it("avisa só a pessoa adicionada", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });

    await avisarColaboradorAdicionado(ABERTO, { id: 20, nome: "Téc" }, 30, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data).toEqual([
      {
        usuarioId: 30,
        tipo: "TICKET_COLABORADOR",
        titulo: "Você foi adicionado ao chamado #7",
        mensagem: 'Téc adicionou você como colaborador em "Notebook não liga".',
        ticketId: 7,
      },
    ]);
  });

  it("quem adiciona a si mesmo não é avisado; usuário inexistente também não", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });

    await avisarColaboradorAdicionado(ABERTO, { id: 30, nome: "Carla" }, 30, deps);
    await avisarColaboradorAdicionado(ABERTO, { id: 20, nome: "Téc" }, 99, deps);

    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });

  it("respeita a preferência de atribuições do usuário", async () => {
    const deps = depsFalsas({ usuarios: PESSOAS });
    deps.prisma.configuracaoUsuario.findMany.mockResolvedValue([{ usuarioId: 30, notificarAtribuicao: false }]);

    await avisarColaboradorAdicionado(ABERTO, { id: 20, nome: "Téc" }, 30, deps);

    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});
