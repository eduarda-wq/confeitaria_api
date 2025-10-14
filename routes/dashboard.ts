import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

// Endpoint para os KPIs (Indicadores-Chave) do dashboard
router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count();
    const bolos = await prisma.bolo.count();       // Alterado de .carro para .bolo
    const pedidos = await prisma.pedido.count();   // Alterado de .proposta para .pedido

    // Resposta JSON atualizada com as novas chaves
    res.status(200).json({ clientes, bolos, pedidos });
  } catch (error) {
    res.status(400).json(error);
  }
});

// Tipo para a resposta do agrupamento de categorias
type CategoriaComContagemBolos = {
  nome: string;
  _count: {
    bolos: number;
  };
};

// Endpoint para o gráfico de bolos por categoria
router.get("/bolosPorCategoria", async (req, res) => { // Endpoint renomeado
  try {
    const categorias = await prisma.categoria.findMany({ // Alterado de .marca para .categoria
      select: {
        nome: true,
        _count: {
          select: { bolos: true } // Alterado de carros para bolos
        }
      }
    });

    // Transforma os dados para o formato que o frontend espera
    const dadosGrafico = categorias
      .filter((item: CategoriaComContagemBolos) => item._count.bolos > 0)
      .map((item: CategoriaComContagemBolos) => ({
        categoria: item.nome,      // Chave 'marca' alterada para 'categoria'
        num: item._count.bolos     // Contagem de 'carros' alterada para 'bolos'
      }));
      
    res.status(200).json(dadosGrafico);
  } catch (error) {
    res.status(400).json(error);
  }
});


// ESTE ENDPOINT NÃO PRECISA DE ALTERAÇÃO
// A lógica de agrupar clientes por cidade é universal.
type ClienteGroupByCidade = {
  cidade: string;
  _count: {
    cidade: number;
  };
};

router.get("/clientesCidade", async (req, res) => {
  try {
    const clientes = await prisma.cliente.groupBy({
      by: ['cidade'],
      _count: {
        cidade: true,
      },
    });

    const dadosGrafico = clientes.map((cliente: ClienteGroupByCidade) => ({
      cidade: cliente.cidade,
      num: cliente._count.cidade
    }));

    res.status(200).json(dadosGrafico);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;