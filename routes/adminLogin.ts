import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: { email }
    })

    if (!admin) {
      return res.status(400).json({ erro: "E-mail não encontrado" })
    }

    const senhaCorreta = bcrypt.compareSync(senha, admin.senha)

    if (!senhaCorreta) {
      const descricao = "Tentativa de acesso ao sistema"
      const complemento = `Senha incorreta para o Admin: ${admin.id} - ${admin.nome}`

      await prisma.log.create({
        data: { descricao, complemento, adminId: admin.id }
      })

      return res.status(400).json({ erro: "Senha incorreta" })
    }

    // Se a senha estiver correta, gera token
    const token = jwt.sign({
      adminLogadoId: admin.id,
      adminLogadoNome: admin.nome,
      adminLogadoNivel: admin.nivel
    },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    )

    res.status(200).json({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      nivel: admin.nivel,
      token
    })

  } catch (error) {
    res.status(500).json({ erro: "Erro interno no servidor", detalhe: error })
  }
})

export default router
