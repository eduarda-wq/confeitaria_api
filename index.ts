import express from 'express'
import cors from 'cors'

import routesBolos from './routes/bolos'
import routesUsuarios from './routes/usuarios'
import routesLogin from './routes/login'
import routesPedidos from './routes/pedidos'
import routesFuncionarios from './routes/funcionarios'
import routesAdmin from './routes/admins'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/bolos", routesBolos)
app.use("/usuarios", routesUsuarios)
app.use("/login", routesLogin)
app.use("/pedidos", routesPedidos)
app.use("/funcionarios", routesFuncionarios)
app.use("/admin", routesAdmin) // <- Adicionar esta linha

app.get('/', (req, res) => {
  res.send('API: Loja de Bolos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})