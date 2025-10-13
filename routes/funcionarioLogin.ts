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
    const funcionario = await prisma.funcionario.findFirst({
      where: { email }
    })

    if (!funcionario) {
      return res.status(400).json({ erro: "E-mail não encontrado" })
    }

    const senhaCorreta = bcrypt.compareSync(senha, funcionario.senha)

    if (!senhaCorreta) {
      return res.status(400).json({ erro: "Senha incorreta" })
    }

    const token = jwt.sign({
      funcionarioLogadoId: funcionario.id,
      funcionarioLogadoNome: funcionario.nome
    },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    )

    res.status(200).json({
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      token
    })

  } catch (error) {
    res.status(500).json({ erro: "Erro interno no servidor", detalhe: error })
  }
})

export default router
