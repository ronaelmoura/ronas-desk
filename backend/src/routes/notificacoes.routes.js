import { Router } from 'express'
import notificacoesController from '../controllers/notificacoesController.js'

const notificacoesRouter = Router()

notificacoesRouter.get('/', notificacoesController.listar)
notificacoesRouter.patch(
  '/ler-todas',
  notificacoesController.marcarTodasComoLidas,
)
notificacoesRouter.patch('/:id/lida', notificacoesController.marcarComoLida)

export default notificacoesRouter
