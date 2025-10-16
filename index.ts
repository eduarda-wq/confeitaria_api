import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import routesCategorias from './routes/categorias';
import routesBolos from './routes/bolos';
import routesPedidos from './routes/pedidos';


import routesLogin from './routes/login';
import routesClientes from './routes/clientes';
import routesDashboard from './routes/dashboard';
import routesAdminLogin from './routes/adminLogin';
import routesAdmins from './routes/admins';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());


app.use("/categorias", routesCategorias); 
app.use("/bolos", routesBolos);           
app.use("/pedidos", routesPedidos);       

app.use("/clientes/login", routesLogin);
app.use("/clientes", routesClientes);
app.use("/dashboard", routesDashboard);
app.use("/admins/login", routesAdminLogin);
app.use("/admins", routesAdmins);


app.get('/', (req, res) => {
  res.send('API da Confeitaria Doce Sabor');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});