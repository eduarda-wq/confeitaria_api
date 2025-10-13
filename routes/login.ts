import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  try {
    console.log("\n--- NOVA TENTATIVA DE LOGIN ---");
    console.log(`[${new Date().toLocaleTimeString()}] 1. Corpo da Requisição Recebido:`, req.body);

    const { email, senha } = req.body;
    const mensaPadrao = "Login ou senha incorretos";

    if (!email || !senha) {
      console.log("[ERRO] E-mail ou senha não foram fornecidos no body.");
      return res.status(400).json({ erro: mensaPadrao });
    }

    // Adicionei .trim() para remover espaços em branco acidentais
    const usuario = await prisma.usuario.findFirst({
      where: { email: email.trim() }
    });

    if (usuario == null) {
      console.log(`[ERRO] Nenhum usuário encontrado no banco para o e-mail: ${email}`);
      return res.status(400).json({ erro: mensaPadrao });
    }

    console.log("2. Usuário encontrado no banco:", { id: usuario.id, nome: usuario.nome });
    console.log("3. Hash da senha armazenado no banco:", usuario.senha);
    
    // MELHORIA: Usando a versão assíncrona do bcrypt.compare
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    
    console.log("4. Resultado da comparação da senha:", senhaCorreta);

    if (senhaCorreta) {
      console.log("5. SUCESSO: Senha correta. Gerando token...");
      
      const token = jwt.sign({
        usuarioLogadoId: usuario.id,
        usuarioLogadoNome: usuario.nome,
        usuarioLogadoTipo: usuario.tipo
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        token
      });

    } else {
      console.log("[ERRO] A comparação da senha retornou 'false'.");
      return res.status(400).json({ erro: mensaPadrao });
    }

  } catch (error) {
    console.error("6. ERRO INESPERADO NO BLOCO CATCH:", error);
    return res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
  }
});

export default router;