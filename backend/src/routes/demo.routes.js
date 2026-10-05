import { Router } from 'express'
import { responderDemo } from '../controllers/demoController.js'

const router = Router()
// Este router é terminal: nenhuma rota desconhecida alcança o banco operacional.
router.use((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return response.status(403).json({
      status: 'erro',
      code: 'DEMO_READ_ONLY',
      message: 'A conta de demonstração permite apenas visualizar os dados.',
    })
  }
  return responderDemo(request, response)
})
export default router
