import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { verificaToken } from '../middewares/verificaToken'

const prisma = new PrismaClient()

const router = Router()

const boloSchema = z.object({
  nome: z.string().min(2,
    { message: "Nome do bolo deve possuir, no mínimo, 2 caracteres" }),
  descricao: z.string().min(10,
    { message: "Descrição deve possuir, no mínimo, 10 caracteres" }),
  foto: z.string().url({ message: "URL da foto inválida" }),
  preco: z.number(),
  peso: z.number(),
  destaque: z.boolean().optional(),
  categoriaId: z.number(),
  adminId: z.string().uuid()
})

router.get("/", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({
      where: {
        ativo: true,
      },
      include: {
        categoria: true,
      },
      orderBy: {
        id: 'desc'
      }
    })
    res.status(200).json(bolos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/destaques", async (req, res) => {
  try {
    const bolos = await prisma.bolo.findMany({
      where: {
        ativo: true,
        destaque: true
      },
      include: {
        categoria: true,
      },
      orderBy: {
        id: 'desc'
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

  const valida = boloSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, descricao, foto, preco, peso,
    destaque = true, categoriaId, adminId } = valida.data

  try {
    const bolo = await prisma.bolo.create({
      data: {
        nome, descricao, foto, preco, peso, destaque,
        categoriaId, adminId
      }
    })
    res.status(201).json(bolo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const bolo = await prisma.bolo.update({
      where: { id: Number(id) },
      data: { ativo: false }
    })

    const adminId = req.userLogadoId as string
    const adminNome = req.userLogadoNome as string

    const descricao = `Exclusão de: ${bolo.nome}`
    const complemento = `Admin: ${adminNome}`

    // registra um log de exclusão de bolo
    const log = await prisma.log.create({
      data: { descricao, complemento, adminId }
    })    

    res.status(200).json(bolo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = boloSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, descricao, foto, preco, peso,
    destaque, categoriaId, adminId } = valida.data

  try {
    const bolo = await prisma.bolo.update({
      where: { id: Number(id) },
      data: {
        nome, descricao, foto, preco, peso,
        destaque, categoriaId, adminId
      }
    })
    res.status(200).json(bolo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  try {
    const bolos = await prisma.bolo.findMany({
      include: {
        categoria: true,
      },
      where: {
        ativo: true,
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { descricao: { contains: termo, mode: "insensitive" } },
          { categoria: { nome: { equals: termo, mode: "insensitive" } } }
        ]
      }
    })
    res.status(200).json(bolos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.patch("/destacar/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const boloDestacar = await prisma.bolo.findUnique({
      where: { id: Number(id) },
      select: { destaque: true },
    });

    const bolo = await prisma.bolo.update({
      where: { id: Number(id) },
      data: { destaque: !boloDestacar?.destaque }
    })
    res.status(200).json(bolo)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router