import { Router } from 'express'
import portalClienteController from '../controllers/portalClienteController.js'
import avaliacoesController from '../controllers/avaliacoesController.js'

const portalClienteRouter = Router()

portalClienteRouter.get('/chamados', portalClienteController.listar)
portalClienteRouter.post('/chamados', portalClienteController.criar)
portalClienteRouter.get('/chamados/:id', portalClienteController.buscarPorId)
portalClienteRouter.get(
  '/chamados/:id/avaliacao',
  avaliacoesController.buscarDoPortal,
)
portalClienteRouter.post(
  '/chamados/:id/avaliacao',
  avaliacoesController.criarDoPortal,
)
portalClienteRouter.get(
  '/chamados/:id/comentarios',
  portalClienteController.listarComentarios,
)
portalClienteRouter.post(
  '/chamados/:id/comentarios',
  portalClienteController.criarComentario,
)

export default portalClienteRouter
