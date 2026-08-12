import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const semSenha = { id: true, nome: true, email: true, papel: true, ativo: true, departamentoId: true, createdAt: true };

export const me = asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: semSenha });
  res.json(usuario);
});

export const listar = asyncHandler(async (req, res) => {
  const usuarios = await prisma.usuario.findMany({ select: semSenha, orderBy: { id: "asc" } });
  res.json(usuarios);
});

export const buscar = asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.params.id) }, select: semSenha });
  if (!usuario) return res.status(404).json({ erro: "Não encontrado" });
  res.json(usuario);
});

export const criar = asyncHandler(async (req, res) => {
  const { nome, email, senha, papel, departamentoId, ativo } = req.body;
  if (!senha) return res.status(400).json({ erro: "senha é obrigatória" });
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, papel, departamentoId, ativo },
    select: semSenha,
  });
  res.status(201).json(usuario);
});

export const atualizar = asyncHandler(async (req, res) => {
  const { nome, email, senha, papel, departamentoId, ativo } = req.body;
  const data = { nome, email, papel, departamentoId, ativo };
  if (senha) data.senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.update({
    where: { id: Number(req.params.id) },
    data,
    select: semSenha,
  });
  res.json(usuario);
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
