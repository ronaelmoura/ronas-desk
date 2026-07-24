import { Router } from 'express'
import usuariosController from '../controllers/usuariosController.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'

const usuariosRouter = Router()

usuariosRouter.get('/', usuariosController.listar)
usuariosRouter.get('/:id', usuariosController.buscarPorId)
usuariosRouter.post('/', adminMiddleware, usuariosController.criar)
usuariosRouter.put('/:id', adminMiddleware, usuariosController.atualizar)
usuariosRouter.patch(
  '/:id/status',
  adminMiddleware,
  usuariosController.alterarStatus,
)
usuariosRouter.delete('/:id', adminMiddleware, usuariosController.excluir)

export default usuariosRouter
