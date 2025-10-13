import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

// Rota de login para funcionários
router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    // Procura por um usuário que seja do tipo FUNCIONARIO
    const funcionario = await prisma.usuario.findFirst({
      where: {
        email,
        tipo: 'FUNCIONARIO'
      }
    })

    if (funcionario == null) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    // Se o e-mail existe, faz-se a comparação da senha
    if (bcrypt.compareSync(senha, funcionario.senha)) {
      // Se a senha confere, gera e retorna o token
      const token = jwt.sign({
        usuarioLogadoId: funcionario.id,
        usuarioLogadoNome: funcionario.nome,
        usuarioLogadoTipo: funcionario.tipo // Adiciona o tipo ao token
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      res.status(200).json({
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        tipo: funcionario.tipo,
        token
      })
    } else {
      // Se a senha estiver incorreta, retorna a mensagem padrão
      res.status(400).json({ erro: mensaPadrao })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router