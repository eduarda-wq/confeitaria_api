import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const funcionario = await prisma.funcionario.findFirst({
      where: { email }
    })

    if (funcionario == null) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    if (bcrypt.compareSync(senha, funcionario.senha)) {
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
    } else {
      res.status(400).json({ erro: mensaPadrao })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router