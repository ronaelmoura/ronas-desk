import { Router } from 'express'
import chamadosController from '../controllers/chamadosController.js'
import chamadoInteracoesController from '../controllers/chamadoInteracoesController.js'

const chamadosRouter = Router()

chamadosRouter.get('/', chamadosController.listar)

chamadosRouter.get('/:id/timeline', chamadoInteracoesController.listarTimeline)

chamadosRouter.get('/:id/auditoria', chamadoInteracoesController.listarTimeline)

chamadosRouter.get(
  '/:id/comentarios',
  chamadoInteracoesController.listarComentarios,
)

chamadosRouter.post(
  '/:id/comentarios',
  chamadoInteracoesController.criarComentario,
)

chamadosRouter.get('/:id', chamadosController.buscarPorId)

chamadosRouter.post('/', chamadosController.criar)

chamadosRouter.put('/:id', chamadosController.atualizar)

chamadosRouter.delete('/:id', chamadosController.excluir)

export default chamadosRouter
