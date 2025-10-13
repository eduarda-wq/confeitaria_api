import express from 'express'
import cors from 'cors'

import 'dotenv/config'

import routesCategorias from './routes/categorias'
import routesBolos from './routes/bolos'
import routesLogin from './routes/login'
import routesClientes from './routes/clientes'
import routesPedidos from './routes/pedidos'
import routesDashboard from './routes/dashboard'
import routesAdminLogin from './routes/adminLogin'
import routesAdmins from './routes/admins'
import routesFuncionarioLogin from './routes/funcionarioLogin'
import routesFuncionarios from './routes/funcionarios'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/categorias", routesCategorias)
app.use("/bolos", routesBolos)
app.use("/clientes/login", routesLogin)
app.use("/clientes", routesClientes)
app.use("/pedidos", routesPedidos)
app.use("/dashboard", routesDashboard)
app.use("/admins/login", routesAdminLogin)
app.use("/admins", routesAdmins)
app.use("/funcionarios/login", routesFuncionarioLogin)
app.use("/funcionarios", routesFuncionarios)


app.get('/', (req, res) => {
  res.send('API: Loja de Bolos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})