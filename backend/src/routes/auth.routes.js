import { Router } from 'express'
import authController from '../controllers/authController.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const authRouter = Router()

authRouter.post('/login', authController.login)
authRouter.get('/me', authMiddleware, authController.me)
authRouter.patch('/me', authMiddleware, authController.atualizarPerfil)
authRouter.patch('/me/password', authMiddleware, authController.alterarSenha)

export default authRouter
