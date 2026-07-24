import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import chamadosRouter from './routes/chamados.routes.js'
import clientesRouter from './routes/clientes.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import authRouter from './routes/auth.routes.js'
import usuariosRouter from './routes/usuarios.routes.js'
import authMiddleware from './middlewares/authMiddleware.js'
import pool from './database/db.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.get('/api/health', async (request, response) => {
  try {
    await pool.query('SELECT 1')

    response.status(200).json({
      status: 'ok',
      message: 'API do Ronas Desk funcionando.',
      database: 'MySQL conectado.',
    })
  } catch (error) {
    console.error('=== ERRO COMPLETO ===')
    console.error(error)

    response.status(500).json({
      status: 'erro',
      message: 'API funcionando, mas o MySQL não conectou.',
      erro: String(error),
    })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/chamados', authMiddleware, chamadosRouter)
app.use('/api/clientes', authMiddleware, clientesRouter)
app.use('/api/dashboard', authMiddleware, dashboardRouter)
app.use('/api/usuarios', authMiddleware, usuariosRouter)

app.use((request, response) => {
  response.status(404).json({
    status: 'erro',
    message: 'Rota não encontrada.',
  })
})

app.listen(PORT, () => {
  console.log(`API do Ronas Desk executando na porta ${PORT}`)
  console.log(`Teste: http://localhost:${PORT}/api/health`)
})
