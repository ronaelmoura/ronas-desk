import { Router } from 'express'
import relatoriosController from '../controllers/relatoriosController.js'

const relatoriosRouter = Router()

relatoriosRouter.get('/chamados', relatoriosController.buscarChamados)

export default relatoriosRouter
