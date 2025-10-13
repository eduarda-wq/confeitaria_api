import { PrismaClient, StatusPedido } from "@prisma/client"
import { Router, Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const router = Router()

// Interface para definir a estrutura do payload do token
interface TokenPayload {
  usuarioLogadoId: string;
  usuarioLogadoNome: string;
  usuarioLogadoTipo: 'CLIENTE' | 'FUNCIONARIO';
}

// Middleware de verificação de funcionário
const verificaFuncionario = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ erro: "Token não fornecido" })
  }

  // Separa o "Bearer" do token
  const [, token] = authorization.split(" ")

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY as string)
    const { usuarioLogadoTipo } = decoded as TokenPayload

    // Se o tipo do usuário no token não for FUNCIONARIO, nega o acesso
    if (usuarioLogadoTipo !== 'FUNCIONARIO') {
      return res.status(403).json({ erro: "Acesso negado: rota exclusiva para funcionários." })
    }

    // Se for funcionário, permite que a requisição continue
    return next()

  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado" })
  }
}

// O middleware é aplicado a todas as rotas definidas neste arquivo
router.use(verificaFuncionario)

// Rota para funcionário listar TODOS os pedidos de todos os clientes
router.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        usuario: { select: { nome: true } },
        bolo: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// Rota para funcionário atualizar o status de um pedido específico
router.patch('/pedidos/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  // Valida se o status enviado é um valor válido do Enum
  if (!Object.values(StatusPedido).includes(status)) {
    return res.status(400).json({ erro: "Status inválido" })
  }

  try {
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    })
    res.status(200).json(pedidoAtualizado)
  } catch (error) {
    res.status(404).json({ erro: "Pedido não encontrado" })
  }
})

// Rota para funcionário listar todos os usuários cadastrados
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
                createdAt: true,
            }
        })
        res.status(200).json(usuarios)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

export default router