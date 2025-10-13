import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const bolos = await prisma.bolo.count()
    const pedidos = await prisma.pedido.count()
    res.status(200).json({ clientes, bolos, pedidos })
  } catch (error) {
    res.status(400).json(error)
  }
})

type CategoriaGroupByNome = {
  nome: string
  _count: {
    bolos: number
  }
}

router.get("/bolosCategoria", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      select: {
        nome: true,
        _count: {
          select: { bolos: true }
        }
      }
    })

    const categorias2 = categorias
        .filter((item: CategoriaGroupByNome) => item._count.bolos > 0)
        .map((item: CategoriaGroupByNome) => ({
            categoria: item.nome,
            num: item._count.bolos
        }))
    res.status(200).json(categorias2)
  } catch (error) {
    res.status(400).json(error)
  }
})

type ClienteGroupByCidade = {
  cidade: string
  _count: {
    cidade: number
  }
}

router.get("/clientesCidade", async (req, res) => {
  try {
    const clientes = await prisma.cliente.groupBy({
      by: ['cidade'],
      _count: {
        cidade: true,
      },
    })

    const clientes2 = clientes.map((cliente: ClienteGroupByCidade) => ({
      cidade: cliente.cidade,
      num: cliente._count.cidade
    }))

    res.status(200).json(clientes2)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router