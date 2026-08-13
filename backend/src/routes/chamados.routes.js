import { Router } from 'express'
import chamadosController from '../controllers/chamadosController.js'
import chamadoInteracoesController from '../controllers/chamadoInteracoesController.js'
import anexosController from '../controllers/anexosController.js'
import assistenteIaController from '../controllers/assistenteIaController.js'
import anexoUploadMiddleware from '../middlewares/anexoUploadMiddleware.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'

const chamadosRouter = Router()

chamadosRouter.get('/', chamadosController.listar)

chamadosRouter.get('/:id/timeline', chamadoInteracoesController.listarTimeline)

chamadosRouter.get('/:id/auditoria', chamadoInteracoesController.listarTimeline)

chamadosRouter.get('/:id/history', chamadoInteracoesController.listarHistorico)

chamadosRouter.get(
  '/:id/comentarios',
  chamadoInteracoesController.listarComentarios,
)

chamadosRouter.post(
  '/:id/comentarios',
  chamadoInteracoesController.criarComentario,
)

chamadosRouter.post('/:id/assistente-ia', assistenteIaController.gerarResumo)

chamadosRouter.get('/:id/anexos', anexosController.listar)

chamadosRouter.post(
  '/:id/anexos',
  anexoUploadMiddleware,
  anexosController.criar,
)

chamadosRouter.get(
  '/:id/anexos/:anexoId/download',
  anexosController.gerarDownload,
)

chamadosRouter.delete(
  '/:id/anexos/:anexoId',
  adminMiddleware,
  anexosController.excluir,
)

chamadosRouter.get('/:id', chamadosController.buscarPorId)

chamadosRouter.post('/', chamadosController.criar)

chamadosRouter.put('/:id', chamadosController.atualizar)

chamadosRouter.delete('/:id', adminMiddleware, chamadosController.excluir)

export default chamadosRouter
