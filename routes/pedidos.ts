import { PrismaClient, StatusPedido } from "@prisma/client"
import { Router } from "express"
import { z } from 'zod'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()
const router = Router()

const pedidoSchema = z.object({
  clienteId: z.string().uuid(),
  boloId: z.number(),
  quantidade: z.number().min(1),
  observacao: z.string().optional(),
  dataEntrega: z.string().transform((str) => new Date(str)),
})

async function enviaEmail(nome: string, email: string,
  boloNome: string, status: string) {

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA,
  },
});

  const info = await transporter.sendMail({
    from: 'seuemail@gmail.com', // sender address
    to: email, // list of receivers
    subject: "Re: Pedido Loja de Bolos", // Subject line
    text: `Seu pedido do bolo ${boloNome} está ${status}`, // plain text body
    html: `<h3>Estimado Cliente: ${nome}</h3>
           <h3>Seu pedido do bolo ${boloNome} teve seu status alterado para: ${status}</h3>
           <p>Muito obrigado pela sua preferência!</p>
           <p>Loja de Bolos</p>`
  });

  console.log("Message sent: %s", info.messageId);
}

router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        bolo: {
          include: {
            categoria: true
          }
        },
        funcionario: true
      },
      orderBy: { id: 'desc'}
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", async (req, res) => {

  const valida = pedidoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }  
  const { clienteId, boloId, quantidade, observacao, dataEntrega } = valida.data

  try {
    const pedido = await prisma.pedido.create({
      data: { clienteId, boloId, quantidade, observacao, dataEntrega }
    })
    res.status(201).json(pedido)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId },
      include: {
        bolo: {
          include: {
            categoria: true
          }
        }
      }
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.patch("/:id", async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status || !Object.values(StatusPedido).includes(status)) {
    res.status(400).json({ "erro": "Informe um status válido para o pedido" })
    return
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    })

    const dados = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
        bolo: true
      }
    })

    enviaEmail(dados?.cliente.nome as string,
      dados?.cliente.email as string,
      dados?.bolo.nome as string,
      status)

    res.status(200).json(pedido)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router