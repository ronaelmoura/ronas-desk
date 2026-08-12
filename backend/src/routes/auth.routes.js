import { Router } from 'express'
import authController from '../controllers/authController.js'
import authMiddleware from '../middlewares/authMiddleware.js'
import demoReadOnlyMiddleware from '../middlewares/demoReadOnlyMiddleware.js'

const authRouter = Router()

authRouter.post('/login', authController.login)
authRouter.post('/demo', authController.loginDemo)
authRouter.get('/me', authMiddleware, authController.me)
authRouter.patch(
  '/me',
  authMiddleware,
  demoReadOnlyMiddleware,
  authController.atualizarPerfil,
)
authRouter.patch(
  '/me/password',
  authMiddleware,
  demoReadOnlyMiddleware,
  authController.alterarSenha,
)

export default authRouter
