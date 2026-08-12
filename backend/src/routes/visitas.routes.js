import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import authMiddleware from '../middlewares/authMiddleware.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'
import visitasController from '../controllers/visitasController.js'

const visitasRouter = Router()
const limitadorRegistro = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'erro',
    message: 'Muitas visitas registradas. Tente novamente em instantes.',
  },
})

visitasRouter.post('/', limitadorRegistro, visitasController.registrar)
visitasRouter.get(
  '/resumo',
  authMiddleware,
  adminMiddleware,
  visitasController.buscarResumo,
)

export default visitasRouter
