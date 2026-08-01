import 'dotenv/config'
import { criarApp } from './app.js'

const app = criarApp()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`API do Ronas Desk executando na porta ${PORT}`)
  console.log(`Teste: http://localhost:${PORT}/api/health`)
})
