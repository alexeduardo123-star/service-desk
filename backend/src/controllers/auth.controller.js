import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { enviarEmail } from "../utils/mailer.js";

const CODIGO_VALIDADE_MINUTOS = 15;

function gerarCodigoNumerico() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, papel: usuario.papel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function usuarioPublico(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
}

async function enviarCodigoVerificacao(usuario) {
  const codigo = gerarCodigoNumerico();

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      verificacaoTokenHash: hashToken(codigo),
      verificacaoTokenExpiresAt: new Date(Date.now() + CODIGO_VALIDADE_MINUTOS * 60 * 1000),
    },
  });

  await enviarEmail({
    to: usuario.email,
    subject: "Confirme seu email — Service Desk",
    text:
      `Olá, ${usuario.nome}!\n\n` +
      `Use o código abaixo para confirmar seu email e ativar sua conta. Ele expira em ${CODIGO_VALIDADE_MINUTOS} minutos:\n\n` +
      `${codigo}\n\n` +
      `Se você não fez esse cadastro, ignore este email.`,
    html:
      `<p>Olá, ${usuario.nome}!</p>` +
      `<p>Use o código abaixo para confirmar seu email e ativar sua conta. Ele expira em ${CODIGO_VALIDADE_MINUTOS} minutos:</p>` +
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${codigo}</p>` +
      `<p>Se você não fez esse cadastro, ignore este email.</p>`,
  });
}

export const registrar = asyncHandler(async (req, res) => {
  const { nome, email, senha } = req.body;

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, papel: "SOLICITANTE", emailVerificado: false },
  });

  await enviarCodigoVerificacao(usuario);

  res.status(201).json({
    mensagem: "Cadastro realizado. Enviamos um código de confirmação para o seu email.",
    email: usuario.email,
  });
});

export const verificarEmail = asyncHandler(async (req, res) => {
  const { email, codigo } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (
    !usuario ||
    !usuario.verificacaoTokenHash ||
    !usuario.verificacaoTokenExpiresAt ||
    usuario.verificacaoTokenExpiresAt < new Date() ||
    usuario.verificacaoTokenHash !== hashToken(codigo)
  ) {
    return res.status(400).json({ erro: "Código inválido ou expirado" });
  }

  const usuarioVerificado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { emailVerificado: true, verificacaoTokenHash: null, verificacaoTokenExpiresAt: null },
  });

  const token = gerarToken(usuarioVerificado);
  res.json({ token, usuario: usuarioPublico(usuarioVerificado) });
});

export const reenviarVerificacao = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const mensagemGenerica = {
    mensagem: "Se este email tiver um cadastro pendente de confirmação, um novo código foi enviado.",
  };

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || usuario.emailVerificado) {
    return res.json(mensagemGenerica);
  }

  await enviarCodigoVerificacao(usuario);
  res.json(mensagemGenerica);
});

export const login = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  if (!usuario.emailVerificado) {
    return res.status(403).json({
      erro: "Email ainda não confirmado. Verifique seu email para ativar a conta.",
      emailNaoVerificado: true,
    });
  }

  const token = gerarToken(usuario);
  res.json({ token, usuario: usuarioPublico(usuario) });
});

export const esqueciSenha = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const mensagemGenerica = {
    mensagem: "Se este email estiver cadastrado, um código de recuperação foi enviado.",
  };

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  // Resposta idêntica exista ou não o email, para não revelar quais emails
  // estão cadastrados na base.
  if (!usuario || !usuario.ativo) {
    return res.json(mensagemGenerica);
  }

  const codigo = gerarCodigoNumerico();
  const resetTokenHash = hashToken(codigo);
  const resetTokenExpiresAt = new Date(Date.now() + CODIGO_VALIDADE_MINUTOS * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { resetTokenHash, resetTokenExpiresAt },
  });

  await enviarEmail({
    to: usuario.email,
    subject: "Recuperação de senha — Service Desk",
    text:
      `Olá, ${usuario.nome}!\n\n` +
      `Use o código abaixo para redefinir sua senha. Ele expira em ${CODIGO_VALIDADE_MINUTOS} minutos:\n\n` +
      `${codigo}\n\n` +
      `Se você não solicitou isso, ignore este email.`,
    html:
      `<p>Olá, ${usuario.nome}!</p>` +
      `<p>Use o código abaixo para redefinir sua senha. Ele expira em ${CODIGO_VALIDADE_MINUTOS} minutos:</p>` +
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${codigo}</p>` +
      `<p>Se você não solicitou isso, ignore este email.</p>`,
  });

  res.json(mensagemGenerica);
});

export const redefinirSenha = asyncHandler(async (req, res) => {
  const { email, codigo, novaSenha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (
    !usuario ||
    !usuario.resetTokenHash ||
    !usuario.resetTokenExpiresAt ||
    usuario.resetTokenExpiresAt < new Date()
  ) {
    return res.status(400).json({ erro: "Código inválido ou expirado" });
  }

  const codigoValido = usuario.resetTokenHash === hashToken(codigo);
  if (!codigoValido) {
    return res.status(400).json({ erro: "Código inválido ou expirado" });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  res.json({ mensagem: "Senha redefinida com sucesso." });
});
