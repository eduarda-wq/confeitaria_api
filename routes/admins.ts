import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaFuncionario } from "../middlewares/verificaFuncionario" // Supondo que o middleware se chame assim

const prisma = new PrismaClient()
const router = Router()

// Schema para validação de dados de um novo funcionário
const funcionarioSchema = z.object({
  nome: z.string().min(3,
    { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.string().email({ message: "Por favor, informe um e-mail válido" }),
  senha: z.string(),
})

// Rota para listar todos os funcionários (protegida)
router.get("/", verificaFuncionario, async (req, res) => {
  try {
    const funcionarios = await prisma.usuario.findMany({
      where: {
        tipo: 'FUNCIONARIO'
      },
      select: { // Seleciona os campos para não expor a senha
        id: true,
        nome: true,
        email: true,
        tipo: true,
        createdAt: true
      }
    })
    res.status(200).json(funcionarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

// Rota para cadastrar um novo funcionário (protegida)
router.post("/", verificaFuncionario, async (req, res) => {

  const result = funcionarioSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues })
    return
  }

  const erros = validaSenha(result.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(result.data.senha, salt)

  const { nome, email } = result.data

  try {
    const funcionario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hash,
        tipo: 'FUNCIONARIO' // Define o tipo como FUNCIONARIO
      }
    })
    // Retorna o funcionário criado sem a senha
    const { senha, ...funcionarioSemSenha } = funcionario;
    res.status(201).json(funcionarioSemSenha)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Rota para buscar um funcionário específico por ID (protegida)
router.get("/:id", verificaFuncionario, async (req, res) => {
  const { id } = req.params
  try {
    const funcionario = await prisma.usuario.findFirst({
      where: {
        id,
        tipo: 'FUNCIONARIO'
      },
      select: { // Seleciona os campos para não expor a senha
        id: true,
        nome: true,
        email: true,
        tipo: true,
        createdAt: true
      }
    })
    res.status(200).json(funcionario)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router