import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { verificaToken } from '../middewares/verificaToken';

const prisma = new PrismaClient();
const router = Router();

// Schema de validação Zod para Bolos, alinhado com o novo schema.prisma
const boloSchema = z.object({
  nome: z.string().min(3, { message: "Nome do bolo deve ter, no mínimo, 3 caracteres" }),
  descricao: z.string().min(10, { message: "Descrição deve ter, no mínimo, 10 caracteres" }),
  preco: z.number().positive({ message: "O preço deve ser um número positivo" }),
  peso: z.number().int().positive({ message: "O peso deve ser um número inteiro positivo" }),
  foto: z.string().url({ message: "URL da foto inválida" }),
  destaque: z.boolean().optional(),
  categoriaId: z.number().int(),
  adminId: z.string().uuid()
});

// Rota para listar todos os bolos ativos
router.get("/", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({ // Alterado de .carro para .bolo
      where: { ativo: true },
      include: { categoria: true }, // Alterado de marca para categoria
      orderBy: { id: 'desc' }
    });
    res.status(200).json(bolos);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

// Rota para listar os bolos em destaque
router.get("/destaques", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({ // Alterado para .bolo
      where: {
        ativo: true,
        destaque: true
      },
      include: { categoria: true }, // Alterado para categoria
      orderBy: { id: 'desc' }
    });
    res.status(200).json(bolos);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});


router.get("/recentes", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({
      where: { ativo: true },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }, // Ordena pelos mais recentes primeiro
      take: 10, // Limita o resultado a 10 registos
    });
    res.status(200).json(bolos);
  } catch (error) {
    console.error("Erro ao buscar bolos recentes:", error);
    res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
  }
});

// Rota para obter um bolo específico pelo ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const bolo = await prisma.bolo.findFirst({ // Alterado para .bolo
      where: { id: Number(id) },
      include: { categoria: true } // Alterado para categoria
    });
    res.status(200).json(bolo);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

// Rota para criar um novo bolo
router.post("/", verificaToken, async (req, res) => {
  const valida = boloSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }
  // Campos desestruturados de acordo com o boloSchema
  const { nome, descricao, preco, peso, foto, destaque = false, categoriaId, adminId } = valida.data;

  try {
    const bolo = await prisma.bolo.create({ // Alterado para .bolo
      data: {
        nome, descricao, preco, peso, foto, destaque, categoriaId, adminId
      }
    });
    res.status(201).json(bolo);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Rota para "excluir" um bolo (soft delete)
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const bolo = await prisma.bolo.update({ // Alterado para .bolo
      where: { id: Number(id) },
      data: { ativo: false }
    });

    const adminId = req.userLogadoId as string;
    const adminNome = req.userLogadoNome as string;
    
    // Log atualizado para o contexto de bolo
    const descricaoLog = `Exclusão do bolo: ${bolo.nome}`;
    const complemento = `Admin: ${adminNome}`;

    await prisma.log.create({
      data: { descricao: descricaoLog, complemento, adminId }
    });

    res.status(200).json(bolo);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

// Rota para atualizar um bolo existente
router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  const valida = boloSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { nome, descricao, preco, peso, foto, destaque, categoriaId, adminId } = valida.data;

  try {
    const bolo = await prisma.bolo.update({ // Alterado para .bolo
      where: { id: Number(id) },
      data: {
        nome, descricao, preco, peso, foto, destaque, categoriaId, adminId
      }
    });
    res.status(200).json(bolo);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Rota de pesquisa adaptada para bolos
router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;
  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    // Se não for um número, pesquisa por texto no nome, descrição ou categoria
    try {
      const bolos = await prisma.bolo.findMany({
        include: { categoria: true },
        where: {
          ativo: true,
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { descricao: { contains: termo, mode: "insensitive" } },
            { categoria: { nome: { contains: termo, mode: "insensitive" } } }
          ]
        }
      });
      res.status(200).json(bolos);
    } catch (error) {
      res.status(500).json({ erro: error });
    }
  } else {
    // Se for um número, pesquisa por preço máximo (menor ou igual a)
    try {
      const bolos = await prisma.bolo.findMany({
        include: { categoria: true },
        where: {
          ativo: true,
          preco: { lte: termoNumero } // lte = less than or equal
        }
      });
      res.status(200).json(bolos);
    } catch (error) {
      res.status(500).json({ erro: error });
    }
  }
});

// Rota para alternar o status de destaque
router.patch("/destacar/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const boloAtual = await prisma.bolo.findUnique({ // Alterado para .bolo
      where: { id: Number(id) },
      select: { destaque: true },
    });

    const bolo = await prisma.bolo.update({ // Alterado para .bolo
      where: { id: Number(id) },
      data: { destaque: !boloAtual?.destaque }
    });
    res.status(200).json(bolo);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;