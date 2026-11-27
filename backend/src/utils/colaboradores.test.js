import { describe, it, expect } from "vitest";
import {
  achatarColaboradores,
  colaboradorQueViraResponsavel,
  comentarioColaboradorAdicionado,
  comentarioColaboradorRemovido,
  erroAoAdicionarColaborador,
  erroAoRemoverColaborador,
} from "./colaboradores.js";

const TICKET = { id: 7, status: "EM_ANDAMENTO", solicitanteId: 10, tecnicoId: 20 };
const BRUNO = { id: 21, nome: "Bruno", papel: "TECNICO", ativo: true };

describe("erroAoAdicionarColaborador", () => {
  it("aceita técnico, admin ou gestor ativo que ainda não colabora", () => {
    expect(erroAoAdicionarColaborador(TICKET, BRUNO, [])).toBeNull();
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, papel: "ADMIN" }, [22])).toBeNull();
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, papel: "GESTOR" })).toBeNull();
  });

  it("aceita em chamado sem responsável, suspenso ou aguardando o usuário", () => {
    expect(erroAoAdicionarColaborador({ ...TICKET, tecnicoId: null, status: "ABERTO" }, BRUNO)).toBeNull();
    expect(erroAoAdicionarColaborador({ ...TICKET, status: "SUSPENSO" }, BRUNO)).toBeNull();
    expect(erroAoAdicionarColaborador({ ...TICKET, status: "AGUARDANDO_USUARIO" }, BRUNO)).toBeNull();
  });

  it("chamado fechado não aceita mudanças", () => {
    expect(erroAoAdicionarColaborador({ ...TICKET, status: "FECHADO" }, BRUNO)).toBe(
      "Chamado fechado não aceita mudanças nos colaboradores"
    );
  });

  it("recusa usuário inexistente", () => {
    expect(erroAoAdicionarColaborador(TICKET, null)).toBe("Usuário não encontrado");
  });

  it("recusa o solicitante do chamado, mesmo que seja da equipe", () => {
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, id: 10 })).toBe("O solicitante do chamado não pode ser colaborador");
  });

  it("recusa o atendente responsável", () => {
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, id: 20 })).toBe("O atendente responsável não pode ser colaborador");
  });

  it("recusa usuário com perfil solicitante", () => {
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, papel: "SOLICITANTE" })).toBe(
      "Usuários com perfil solicitante não podem ser colaboradores"
    );
  });

  it("recusa usuário inativo", () => {
    expect(erroAoAdicionarColaborador(TICKET, { ...BRUNO, ativo: false })).toBe("Usuário inativo não pode ser colaborador");
  });

  it("recusa quem já é colaborador", () => {
    expect(erroAoAdicionarColaborador(TICKET, BRUNO, [21])).toBe("Este usuário já é colaborador do chamado");
  });
});

describe("erroAoRemoverColaborador", () => {
  it("permite remover enquanto o chamado não está fechado", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "SUSPENSO"]) {
      expect(erroAoRemoverColaborador({ ...TICKET, status })).toBeNull();
    }
  });

  it("chamado fechado não aceita mudanças", () => {
    expect(erroAoRemoverColaborador({ ...TICKET, status: "FECHADO" })).toBe("Chamado fechado não aceita mudanças nos colaboradores");
  });
});

describe("colaboradorQueViraResponsavel", () => {
  it("aponta o registro do novo responsável neste chamado", () => {
    expect(colaboradorQueViraResponsavel(7, 21)).toEqual({ ticketId: 7, usuarioId: 21 });
  });
});

describe("achatarColaboradores", () => {
  it("deixa só { id, nome } de cada colaborador", () => {
    const ticket = { id: 7, colaboradores: [{ usuario: { id: 21, nome: "Bruno" } }, { usuario: { id: 22, nome: "Carla" } }] };
    expect(achatarColaboradores(ticket)).toEqual({
      id: 7,
      colaboradores: [{ id: 21, nome: "Bruno" }, { id: 22, nome: "Carla" }],
    });
  });

  it("não mexe em ticket sem colaboradores carregados", () => {
    expect(achatarColaboradores({ id: 7 })).toEqual({ id: 7 });
    expect(achatarColaboradores(null)).toBeNull();
  });
});

describe("comentários do histórico", () => {
  it("registra quem adicionou e quem removeu", () => {
    expect(comentarioColaboradorAdicionado({ nome: "Téc" }, BRUNO)).toBe("Téc adicionou Bruno como colaborador");
    expect(comentarioColaboradorRemovido({ nome: "Téc" }, BRUNO)).toBe("Téc removeu Bruno dos colaboradores");
  });
});
