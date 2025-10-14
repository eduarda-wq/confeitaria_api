import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// --- Importações das Rotas Refatoradas ---
// Assumindo que os ficheiros foram renomeados (ex: marcas.ts -> categorias.ts)
import routesCategorias from './routes/categorias';
import routesBolos from './routes/bolos';
import routesPedidos from './routes/pedidos';

// --- Importações das Rotas Universais (sem alteração de nome) ---
import routesLogin from './routes/login';
import routesClientes from './routes/clientes';
import routesDashboard from './routes/dashboard';
import routesAdminLogin from './routes/adminLogin';
import routesAdmins from './routes/admins';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// --- Montagem das Rotas na Aplicação ---

// Rotas refatoradas
app.use("/categorias", routesCategorias); // De: /marcas
app.use("/bolos", routesBolos);           // De: /carros
app.use("/pedidos", routesPedidos);       // De: /propostas

// Rotas universais (mantidas)
app.use("/clientes/login", routesLogin);
app.use("/clientes", routesClientes);
app.use("/dashboard", routesDashboard);
app.use("/admins/login", routesAdminLogin);
app.use("/admins", routesAdmins);


// Rota principal com mensagem atualizada
app.get('/', (req, res) => {
  res.send('API da Confeitaria Doce Sabor');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});