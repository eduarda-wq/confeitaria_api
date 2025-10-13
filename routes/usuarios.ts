import { PrismaClient, TipoUsuario } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaFuncionario } from "../middlewares/verificaFuncionario"

const prisma = new PrismaClient()
const router = Router()

// Schema para o cadastro PÚBLICO de clientes
const clienteSchema = z.object({
  nome: z.string().min(3, {
    message: "O nome deve possuir, no mínimo, 3 caracteres"
  }),
  email: z.string().email({ message: "Informe um e-mail válido" }),
  senha: z.string(),
})

// Schema para o cadastro de FUNCIONÁRIOS (rota protegida)
const funcionarioSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.string().email({ message: "Informe um e-mail válido" }),
  senha: z.string(),
})


function validaSenha(senha: string) {
  const mensa: string[] = []
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }
  let pequenas = 0, grandes = 0, numeros = 0, simbolos = 0
  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) pequenas++
    else if ((/[A-Z]/).test(letra)) grandes++
    else if ((/[0-9]/).test(letra)) numeros++
    else simbolos++
  }
  if (pequenas == 0) mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  if (grandes == 0) mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  if (numeros == 0) mensa.push("Erro... senha deve possuir número(s)")
  if (simbolos == 0) mensa.push("Erro... senha deve possuir símbolo(s)")
  return mensa
}


// ROTA PÚBLICA: Cadastro de novos clientes
router.post("/", async (req, res) => {

  const result = clienteSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ erro: result.error.issues })
  }

  const erros = validaSenha(result.data.senha)
  if (erros.length > 0) {
    return res.status(400).json({ erro: erros.join("; ") })
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(result.data.senha, salt)

  const { nome, email } = result.data

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, tipo: 'CLIENTE' } // Tipo é sempre CLIENTE aqui
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

// -----------------------------------------------------------------
// ROTAS PROTEGIDAS PARA FUNCIONÁRIOS
// -----------------------------------------------------------------

// ROTA PROTEGIDA: Cadastro de novos funcionários por outro funcionário
router.post("/funcionarios", verificaFuncionario, async (req, res) => {
    
    const result = funcionarioSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ erro: result.error.issues })
    }
  
    const erros = validaSenha(result.data.senha)
    if (erros.length > 0) {
      return res.status(400).json({ erro: erros.join("; ") })
    }
  
    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(result.data.senha, salt)
  
    const { nome, email } = result.data
  
    try {
      const funcionario = await prisma.usuario.create({
        data: { nome, email, senha: hash, tipo: 'FUNCIONARIO' } // Tipo é sempre FUNCIONARIO aqui
      })
      res.status(201).json(funcionario)
    } catch (error) {
      res.status(400).json(error)
    }
})


// ROTA PROTEGIDA: Listagem de todos os usuários
router.get("/", verificaFuncionario, async (req, res) => {
    try {
      const usuarios = await prisma.usuario.findMany()
      res.status(200).json(usuarios)
    } catch (error) {
      res.status(400).json(error)
    }
})
  
router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
        const usuario = await prisma.usuario.findUnique({
        where: { id }
        })
        res.status(200).json(usuario)
    } catch (error) {
        res.status(400).json(error)
    }
})


export default router