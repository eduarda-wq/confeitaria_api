import { PrismaClient, StatusPedido } from "@prisma/client"
import { Router } from "express"
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const pedidoSchema = z.object({
  usuarioId: z.string().uuid({ message: "ID de usuário inválido" }),
  boloId: z.number().int(),
  quantidade: z.number().int().positive({ message: "A quantidade deve ser positiva" }),
  observacoes: z.string().optional(),
})

// Rota para listar todos os pedidos (geralmente para funcionários)
router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        usuario: {
          select: { nome: true, email: true }
        },
        bolo: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Rota para um cliente criar um novo pedido
router.post("/", async (req, res) => {

  const result = pedidoSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }
  const { usuarioId, boloId, quantidade, observacoes } = result.data

  try {
    const bolo = await prisma.bolo.findUnique({
      where: { id: boloId }
    })

    if (!bolo) {
      return res.status(404).json({ erro: "Bolo não encontrado" })
    }

    const valor_total = Number(bolo.preco) * quantidade;

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        boloId,
        quantidade,
        valor_total,
        observacoes
      }
    })
    res.status(201).json(pedido)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Rota para listar os pedidos de um cliente específico
router.get("/usuario/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId },
      include: {
        bolo: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Rota para um funcionário atualizar o status de um pedido
router.patch("/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Valida se o status enviado é um dos valores permitidos no enum
  if (!Object.values(StatusPedido).includes(status)) {
    return res.status(400).json({ erro: "Status inválido" });
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.status(200).json(pedido);
  } catch (error) {
    res.status(400).json(error);
  }
});


export default router