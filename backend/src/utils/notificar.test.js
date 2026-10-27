import { describe, it, expect, vi } from "vitest";
import { deveNotificar, filtrarDestinatarios, notificarUsuarios } from "./notificar.js";

function depsFalsas({ configs = [] } = {}) {
  return {
    prisma: {
      configuracaoUsuario: { findMany: vi.fn().mockResolvedValue(configs) },
      notificacao: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    },
    enviarEmail: vi.fn().mockResolvedValue(undefined),
  };
}

describe("deveNotificar", () => {
  it("entrega quando o usuário não tem configuração", () => {
    expect(deveNotificar(null, "TICKET_STATUS")).toBe(true);
  });

  it("respeita a preferência desligada do tipo", () => {
    expect(deveNotificar({ notificarStatus: false }, "TICKET_STATUS")).toBe(false);
    expect(deveNotificar({ notificarStatus: false }, "TICKET_COMENTARIO")).toBe(true);
  });

  it("sempre entrega tipos sem preferência (SISTEMA)", () => {
    expect(deveNotificar({ notificarStatus: false, notificarComentario: false }, "SISTEMA")).toBe(true);
  });
});

describe("filtrarDestinatarios", () => {
  it("remove o autor, duplicados, nulos e inativos", () => {
    const lista = [{ id: 1 }, { id: 2 }, { id: 2 }, null, { id: 3, ativo: false }, { id: 4, ativo: true }];
    expect(filtrarDestinatarios(lista, 1).map((u) => u.id)).toEqual([2, 4]);
  });
});

describe("notificarUsuarios", () => {
  it("cria uma notificação para cada destinatário elegível", async () => {
    const deps = depsFalsas();
    const total = await notificarUsuarios(
      { destinatarios: [{ id: 1 }, { id: 2 }], tipo: "TICKET_CRIADO", titulo: "Novo", mensagem: "msg", ticketId: 9, autorId: 1 },
      deps
    );
    expect(total).toBe(1);
    expect(deps.prisma.notificacao.createMany).toHaveBeenCalledWith({
      data: [{ usuarioId: 2, tipo: "TICKET_CRIADO", titulo: "Novo", mensagem: "msg", ticketId: 9 }],
    });
  });

  it("pula quem desligou aquele tipo de aviso", async () => {
    const deps = depsFalsas({ configs: [{ usuarioId: 2, notificarComentario: false }] });
    const total = await notificarUsuarios(
      { destinatarios: [{ id: 2 }, { id: 3 }], tipo: "TICKET_COMENTARIO", titulo: "t", mensagem: "m" },
      deps
    );
    expect(total).toBe(1);
    expect(deps.prisma.notificacao.createMany.mock.calls[0][0].data[0].usuarioId).toBe(3);
  });

  it("envia email só para quem ativou notificarEmail", async () => {
    const deps = depsFalsas({ configs: [{ usuarioId: 2, notificarEmail: true }] });
    await notificarUsuarios(
      { destinatarios: [{ id: 2, email: "a@a.com" }, { id: 3, email: "b@b.com" }], tipo: "SISTEMA", titulo: "Aviso", mensagem: "m" },
      deps
    );
    expect(deps.enviarEmail).toHaveBeenCalledTimes(1);
    expect(deps.enviarEmail.mock.calls[0][0].to).toBe("a@a.com");
  });

  it("não cria nada quando não há destinatários", async () => {
    const deps = depsFalsas();
    expect(await notificarUsuarios({ destinatarios: [], tipo: "SISTEMA", titulo: "t", mensagem: "m" }, deps)).toBe(0);
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });

  it("nunca lança quando o banco falha", async () => {
    const deps = depsFalsas();
    deps.prisma.configuracaoUsuario.findMany = vi.fn(() => Promise.reject(new Error("db fora do ar")));
    const spy = console.error;
    console.error = () => {};
    const total = await notificarUsuarios({ destinatarios: [{ id: 2 }], tipo: "SISTEMA", titulo: "t", mensagem: "m" }, deps);
    console.error = spy;
    expect(total).toBe(0);
  });
});
