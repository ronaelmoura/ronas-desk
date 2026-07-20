import { Router } from 'express'
import clientesController from '../controllers/clientesController.js'

const clientesRouter = Router()

clientesRouter.get('/', clientesController.listar)
clientesRouter.get('/:id/chamados', clientesController.listarChamados)
clientesRouter.get('/:id', clientesController.buscarPorId)
clientesRouter.post('/', clientesController.criar)
clientesRouter.put('/:id', clientesController.atualizar)
clientesRouter.delete('/:id', clientesController.excluir)

export default clientesRouter
