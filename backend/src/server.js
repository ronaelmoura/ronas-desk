import express from 'express'
import cors from 'cors'
import chamadosRouter from './routes/chamados.routes.js'

const app = express()
const PORT = 3000

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.get('/api/health', (request, response) => {
  response.status(200).json({
    status: 'ok',
    message: 'API do Ronas Desk funcionando.',
  })
})

app.use('/api/chamados', chamadosRouter)

app.use((request, response) => {
  response.status(404).json({
    status: 'erro',
    message: 'Rota não encontrada.',
  })
})

app.listen(PORT, () => {
  console.log(
    `API do Ronas Desk executando na porta ${PORT}`,
  )

  console.log(
    `Teste: http://localhost:${PORT}/api/health`,
  )
})