import { PrismaClient, StatusPedido } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

// Rota para obter estatísticas gerais da loja
router.get("/estatisticas", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count()
    const bolos = await prisma.bolo.count()
    const pedidos = await prisma.pedido.count()
    res.status(200).json({ usuarios, bolos, pedidos })
  } catch (error) {
    res.status(400).json(error)
  }
})

// Type para a contagem de bolos por categoria
type CategoriaComContagem = {
  nome: string
  _count: {
    bolos: number
  }
}

// Rota para obter a quantidade de bolos por categoria (para gráfico)
router.get("/bolosPorCategoria", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      select: {
        nome: true,
        _count: {
          select: { bolos: true }
        }
      }
    })

    const resultado = categorias
      .filter((item: CategoriaComContagem) => item._count.bolos > 0)
      .map((item: CategoriaComContagem) => ({
        categoria: item.nome,
        num: item._count.bolos
      }))
    res.status(200).json(resultado)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Type para a contagem de pedidos por status
type PedidoGroupByStatus = {
  status: StatusPedido
  _count: {
    status: number
  }
}

// Rota para obter a quantidade de pedidos por status (para gráfico)
router.get("/pedidosPorStatus", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const resultado = pedidos.map((pedido: PedidoGroupByStatus) => ({
      status: pedido.status,
      num: pedido._count.status
    }))

    res.status(200).json(resultado)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router