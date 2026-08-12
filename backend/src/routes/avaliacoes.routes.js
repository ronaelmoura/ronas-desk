import { Router } from 'express'
import avaliacoesController from '../controllers/avaliacoesController.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'

const avaliacoesRouter = Router()

avaliacoesRouter.get(
  '/',
  adminMiddleware,
  avaliacoesController.listarParaAdministracao,
)

export default avaliacoesRouter
