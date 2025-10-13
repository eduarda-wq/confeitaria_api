import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const boloSchema = z.object({
  nome: z.string().min(3,
    { message: "O nome do bolo deve possuir, no mínimo, 3 caracteres" }),
  preco: z.number().positive({ message: "O preço deve ser um número positivo" }),
  foto: z.string().url({ message: "URL da foto inválida" }),
  ingredientes: z.string().min(10, { message: "Ingredientes devem possuir, no mínimo, 10 caracteres" }),
  destaque: z.boolean().optional(),
  categoriaId: z.number().int(),
})

router.get("/", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({
      include: {
        categoria: true,
      }
    })
    res.status(200).json(bolos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const bolo = await prisma.bolo.findFirst({
      where: { id: Number(id) },
      include: {
        categoria: true,
      }
    })
    res.status(200).json(bolo)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const result = boloSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }

  const { nome, preco, foto, ingredientes,
    destaque = false, categoriaId } = result.data

  try {
    const bolo = await prisma.bolo.create({
      data: {
        nome,
        preco,
        foto,
        ingredientes,
        destaque,
        categoriaId
      }
    })
    res.status(201).json(bolo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const bolo = await prisma.bolo.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(bolo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const result = boloSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }

  const { nome, preco, foto, ingredientes,
    destaque, categoriaId } = result.data

  try {
    const bolo = await prisma.bolo.update({
      where: { id: Number(id) },
      data: {
        nome,
        preco,
        foto,
        ingredientes,
        destaque,
        categoriaId
      }
    })
    res.status(200).json(bolo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  const termoNumero = Number(termo)

  if (isNaN(termoNumero)) {
    try {
      const bolos = await prisma.bolo.findMany({
        include: {
          categoria: true,
        },
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { categoria: { nome: { contains: termo, mode: "insensitive" } } }
          ]
        }
      })
      res.status(200).json(bolos)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    try {
      const bolos = await prisma.bolo.findMany({
        include: {
          categoria: true,
        },
        where: { preco: { lte: termoNumero } }
      })
      res.status(200).json(bolos)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  }
})

export default router