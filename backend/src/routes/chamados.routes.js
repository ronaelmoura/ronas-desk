import { Router } from 'express'
import chamadosController from '../controllers/chamadosController.js'

const chamadosRouter = Router()

chamadosRouter.get('/', chamadosController.listar)

chamadosRouter.get('/:id', chamadosController.buscarPorId)

chamadosRouter.post('/', chamadosController.criar)

chamadosRouter.put('/:id', chamadosController.atualizar)

chamadosRouter.delete('/:id', chamadosController.excluir)

export default chamadosRouter
