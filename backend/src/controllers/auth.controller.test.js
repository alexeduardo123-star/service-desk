import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.JWT_SECRET = "segredo-de-teste";
process.env.JWT_EXPIRES_IN = "8h";

vi.mock("../config/prisma.js", () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("../utils/mailer.js", () => ({
  enviarEmail: vi.fn(),
}));

const prisma = (await import("../config/prisma.js")).default;
const { enviarEmail } = await import("../utils/mailer.js");
const {
  registrar,
  verificarEmail,
  reenviarVerificacao,
  login,
  esqueciSenha,
  redefinirSenha,
} = await import("./auth.controller.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

const USUARIO_BASE = {
  id: 1,
  nome: "Fulano",
  email: "fulano@example.com",
  senhaHash: "$2b$10$KIXQ3xW1H8f1p6E0Q1c0uOe6l0m8g8v1o2b7ynh1z2b1p8h1c9m8G", // bcrypt("123456")
  papel: "SOLICITANTE",
  ativo: true,
  emailVerificado: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registrar", () => {
  it("cria usuário não verificado e envia código por email", async () => {
    prisma.usuario.create.mockResolvedValue({ ...USUARIO_BASE, emailVerificado: false });
    prisma.usuario.update.mockResolvedValue({});

    const req = { body: { nome: "Fulano", email: "fulano@example.com", senha: "123456" } };
    const res = mockRes();
    await registrar(req, res, throwingNext);

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerificado: false, papel: "SOLICITANTE" }),
      })
    );
    expect(enviarEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "fulano@example.com" }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: "fulano@example.com" }));
  });
});

describe("verificarEmail", () => {
  it("rejeita código inválido ou expirado", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...USUARIO_BASE,
      verificacaoTokenHash: "outro-hash",
      verificacaoTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const req = { body: { email: USUARIO_BASE.email, codigo: "000000" } };
    const res = mockRes();
    await verificarEmail(req, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejeita código expirado mesmo se o hash bater", async () => {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update("111111").digest("hex");
    prisma.usuario.findUnique.mockResolvedValue({
      ...USUARIO_BASE,
      verificacaoTokenHash: hash,
      verificacaoTokenExpiresAt: new Date(Date.now() - 1000),
    });

    const req = { body: { email: USUARIO_BASE.email, codigo: "111111" } };
    const res = mockRes();
    await verificarEmail(req, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("confirma o email e retorna token quando o código é válido", async () => {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update("222222").digest("hex");
    prisma.usuario.findUnique.mockResolvedValue({
      ...USUARIO_BASE,
      emailVerificado: false,
      verificacaoTokenHash: hash,
      verificacaoTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    prisma.usuario.update.mockResolvedValue({ ...USUARIO_BASE, emailVerificado: true });

    const req = { body: { email: USUARIO_BASE.email, codigo: "222222" } };
    const res = mockRes();
    await verificarEmail(req, res, throwingNext);

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerificado: true, verificacaoTokenHash: null }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.any(String), usuario: expect.any(Object) })
    );
  });
});

describe("reenviarVerificacao", () => {
  it("não envia nada se o usuário já estiver verificado (mas responde igual)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ ...USUARIO_BASE, emailVerificado: true });
    const req = { body: { email: USUARIO_BASE.email } };
    const res = mockRes();
    await reenviarVerificacao(req, res, throwingNext);

    expect(enviarEmail).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });
});

describe("login", () => {
  it("rejeita usuário inexistente", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    const req = { body: { email: "x@x.com", senha: "123456" } };
    const res = mockRes();
    await login(req, res, throwingNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("bloqueia login de email não verificado", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const senhaHash = await bcrypt.hash("123456", 10);
    prisma.usuario.findUnique.mockResolvedValue({ ...USUARIO_BASE, senhaHash, emailVerificado: false });

    const req = { body: { email: USUARIO_BASE.email, senha: "123456" } };
    const res = mockRes();
    await login(req, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ emailNaoVerificado: true }));
  });

  it("autentica com sucesso e retorna token", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const senhaHash = await bcrypt.hash("123456", 10);
    prisma.usuario.findUnique.mockResolvedValue({ ...USUARIO_BASE, senhaHash });

    const req = { body: { email: USUARIO_BASE.email, senha: "123456" } };
    const res = mockRes();
    await login(req, res, throwingNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.any(String), usuario: expect.objectContaining({ email: USUARIO_BASE.email }) })
    );
  });
});

describe("esqueciSenha / redefinirSenha", () => {
  it("esqueciSenha responde com mensagem genérica mesmo se o email não existir", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    const req = { body: { email: "naoexiste@example.com" } };
    const res = mockRes();
    await esqueciSenha(req, res, throwingNext);

    expect(enviarEmail).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });

  it("redefinirSenha rejeita código incorreto", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...USUARIO_BASE,
      resetTokenHash: "hash-diferente",
      resetTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    const req = { body: { email: USUARIO_BASE.email, codigo: "000000", novaSenha: "novaSenha123" } };
    const res = mockRes();
    await redefinirSenha(req, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("redefinirSenha troca a senha quando o código é válido", async () => {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update("333333").digest("hex");
    prisma.usuario.findUnique.mockResolvedValue({
      ...USUARIO_BASE,
      resetTokenHash: hash,
      resetTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    prisma.usuario.update.mockResolvedValue({});

    const req = { body: { email: USUARIO_BASE.email, codigo: "333333", novaSenha: "novaSenha123" } };
    const res = mockRes();
    await redefinirSenha(req, res, throwingNext);

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resetTokenHash: null, resetTokenExpiresAt: null }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });
});
