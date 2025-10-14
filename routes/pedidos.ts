import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const router = Router();

// Schema de validação Zod para um novo Pedido
const pedidoSchema = z.object({
  clienteId: z.string().uuid(),
  boloId: z.number().int(),
  observacoes: z.string().min(5,
    { message: "As observações devem ter, no mínimo, 5 caracteres" }).optional(),
});

/**
 * Função para enviar um e-mail de notificação sobre o status de um pedido.
 */
async function enviarEmailStatus(nomeCliente: string, emailCliente: string,
  nomeBolo: string, observacoes: string, status: string) {

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_EMAIL,
      pass: process.env.MAILTRAP_SENHA,
    },
  });

  const info = await transporter.sendMail({
    from: '"Confeitaria Doce Sabor" <nao-responda@docesabor.com>',
    to: emailCliente,
    subject: `Atualização do seu Pedido: ${status}`, // Assunto dinâmico
    html: `
      <h3>Olá, ${nomeCliente}!</h3>
      <h4>O status do seu pedido foi atualizado: <strong>${status}</strong></h4>
      <p><strong>Detalhes do Pedido:</strong></p>
      <ul>
        <li><strong>Bolo:</strong> ${nomeBolo}</li>
        <li><strong>Suas Observações:</strong> ${observacoes || 'Nenhuma observação.'}</li>
      </ul>
      <p>Agradecemos a sua preferência!</p>
      <p>Atenciosamente,<br>Equipe Doce Sabor</p>
    `
  });

  console.log("E-mail de status enviado: %s", info.messageId);
}

// Rota para listar todos os pedidos (para o admin)
router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        bolo: {
          include: { categoria: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para criar um novo pedido
router.post("/", async (req, res) => {
  const valida = pedidoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }
  const { clienteId, boloId, observacoes = "" } = valida.data;

  try {
    const pedido = await prisma.pedido.create({
      data: { clienteId, boloId, observacoes }
    });
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para listar os pedidos de um cliente específico
router.get("/cliente/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId },
      include: {
        bolo: {
          include: { categoria: true }
        }
      }
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para atualizar o status de um pedido
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ "erro": "Informe o novo status do pedido" });
    return;
  }

  try {
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    });

    // Busca os dados completos para enviar no e-mail
    const dadosParaEmail = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: { cliente: true, bolo: true }
    });

    if (dadosParaEmail) {
      enviarEmailStatus(
        dadosParaEmail.cliente.nome,
        dadosParaEmail.cliente.email,
        dadosParaEmail.bolo.nome,
        dadosParaEmail.observacoes,
        status
      );
    }

    res.status(200).json(pedidoAtualizado);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para excluir/cancelar um pedido
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.delete({
      where: { id: Number(id) }
    });
    res.status(200).json(pedido);
  } catch (error) {
    res.status(400).json(error);
  }
});


export default router;