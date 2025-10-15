import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { verificaToken } from "../middewares/verificaToken";

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

  if (req.userLogadoNivel !== 2 && req.userLogadoNivel !== 5) {
      return res.status(403).json({ erro: "Você não tem permissão para visualizar todos os pedidos." });
  }

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
router.patch("/:id", verificaToken, async (req, res) => { // AGORA PROTEGIDA
  // RESTRITO: Apenas Nível 2 (Funcionário) ou 5 (Admin)
  if (req.userLogadoNivel !== 2 && req.userLogadoNivel !== 5) {
      return res.status(403).json({ erro: "Você não tem permissão para alterar o status." });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ "erro": "Informe o novo status do pedido" });
    return;
  }

  // RESTRITO: Funcionário/Admin não pode mudar para CLIENTE_RECEBEU
  if (status === "CLIENTE_RECEBEU") {
      res.status(400).json({ "erro": "Status inválido para esta operação. A confirmação é feita pelo cliente." });
      return;
  }

  try {
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    });

    // ... (lógica de envio de e-mail permanece a mesma) ...

    res.status(200).json(pedidoAtualizado);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.patch("/recebido/:id", async (req, res) => {
    const { id } = req.params;
    const { clienteId } = req.body;

    if (!clienteId) {
        return res.status(400).json({ erro: "ID do cliente não informado." });
    }

    try {
        const pedido = await prisma.pedido.findUnique({
            where: { id: Number(id) }
        });

        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }

        // 1. Verificar se o cliente é o dono do pedido
        if (pedido.clienteId !== clienteId) {
            return res.status(403).json({ erro: "Você não tem permissão para alterar este pedido." });
        }

        // 2. Ação permitida apenas se o status atual for ENVIADO
        if (pedido.status !== "ENVIADO") {
            return res.status(400).json({ erro: `O pedido deve estar com o status 'ENVIADO' para confirmar o recebimento. Status atual: ${pedido.status}` });
        }

        // 3. Atualizar para CLIENTE_RECEBEU
        const pedidoAtualizado = await prisma.pedido.update({
            where: { id: Number(id) },
            data: { status: "CLIENTE_RECEBEU" }
        });

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