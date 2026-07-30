import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import chamadosRouter from './routes/chamados.routes.js'
import clientesRouter from './routes/clientes.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import authRouter from './routes/auth.routes.js'
import usuariosRouter from './routes/usuarios.routes.js'
import relatoriosRouter from './routes/relatorios.routes.js'
import authMiddleware from './middlewares/authMiddleware.js'
import pool from './database/db.js'

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN =
  process.env.CORS_ORIGIN ||
  (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173')
const FRONTEND_DIST_PATH = process.env.FRONTEND_DIST_PATH
const FRONTEND_INDEX_PATH = FRONTEND_DIST_PATH
  ? path.join(FRONTEND_DIST_PATH, 'index.html')
  : null

if (CORS_ORIGIN) {
  app.use(
    cors({
      origin: CORS_ORIGIN,
    }),
  )
}

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
    console.error(
      'Falha na verificação de saúde do banco:',
      error?.code || 'erro_desconhecido',
    )

    response.status(500).json({
      status: 'erro',
      message: 'API funcionando, mas o MySQL não conectou.',
    })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/chamados', authMiddleware, chamadosRouter)
app.use('/api/clientes', authMiddleware, clientesRouter)
app.use('/api/dashboard', authMiddleware, dashboardRouter)
app.use('/api/usuarios', authMiddleware, usuariosRouter)
app.use('/api/relatorios', authMiddleware, relatoriosRouter)

app.use('/api', (request, response) => {
  response.status(404).json({
    status: 'erro',
    message: 'Rota não encontrada.',
  })
})

if (FRONTEND_DIST_PATH) {
  app.use(express.static(FRONTEND_DIST_PATH))

  app.use((request, response, next) => {
    if (request.method !== 'GET') {
      return next()
    }

    return response.sendFile(FRONTEND_INDEX_PATH)
  })
}

app.use((request, response) => {
  response.status(404).json({
    status: 'erro',
    message: 'Rota não encontrada.',
  })
})

app.listen(PORT, HOST, () => {
  console.log(`API do Ronas Desk executando na porta ${PORT}`)
  console.log(`Teste: http://localhost:${PORT}/api/health`)
})
