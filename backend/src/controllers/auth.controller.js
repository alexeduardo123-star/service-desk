import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, papel: usuario.papel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

export const registrar = asyncHandler(async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, papel: "SOLICITANTE" },
  });

  const token = gerarToken(usuario);
  res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
  });
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

  const token = gerarToken(usuario);
  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
  });
});
