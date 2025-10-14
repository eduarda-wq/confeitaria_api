import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Schema de validação Zod para Categoria
const categoriaSchema = z.object({
  nome: z.string().min(3,
    // Mensagem de erro corrigida e adaptada
    { message: "O nome da categoria deve ter, no mínimo, 3 caracteres" })
});

// Rota para listar todas as categorias
router.get("/", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany(); // Alterado de .marca para .categoria
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

// Rota para criar uma nova categoria
router.post("/", async (req, res) => {
  const valida = categoriaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { nome } = valida.data;

  try {
    const categoria = await prisma.categoria.create({ // Alterado de .marca para .categoria
      data: { nome }
    });
    res.status(201).json(categoria);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Rota para excluir uma categoria
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const categoria = await prisma.categoria.delete({ // Alterado de .marca para .categoria
      where: { id: Number(id) }
    });
    res.status(200).json(categoria);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

// Rota para atualizar uma categoria
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const valida = categoriaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const { nome } = valida.data;

  try {
    const categoria = await prisma.categoria.update({ // Alterado de .marca para .categoria
      where: { id: Number(id) },
      data: { nome }
    });
    res.status(200).json(categoria);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;