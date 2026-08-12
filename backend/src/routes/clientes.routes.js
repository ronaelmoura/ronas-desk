import { Router } from 'express'
import clientesController from '../controllers/clientesController.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'

const clientesRouter = Router()

clientesRouter.get('/', clientesController.listar)
clientesRouter.get('/:id/chamados', clientesController.listarChamados)
clientesRouter.get('/:id', clientesController.buscarPorId)
clientesRouter.post('/', adminMiddleware, clientesController.criar)
clientesRouter.put('/:id', adminMiddleware, clientesController.atualizar)
clientesRouter.delete('/:id', adminMiddleware, clientesController.excluir)

export default clientesRouter
