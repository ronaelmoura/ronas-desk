import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import demoReadOnlyMiddleware from '../middlewares/demoReadOnlyMiddleware.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'
import configuracaoEmpresaController from '../controllers/configuracaoEmpresaController.js'

const configuracaoEmpresaRouter = Router()

configuracaoEmpresaRouter.get('/', configuracaoEmpresaController.buscar)
configuracaoEmpresaRouter.put(
  '/',
  authMiddleware,
  demoReadOnlyMiddleware,
  adminMiddleware,
  configuracaoEmpresaController.atualizar,
)

export default configuracaoEmpresaRouter
