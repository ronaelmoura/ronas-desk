import { Router } from 'express'
import dashboardController from '../controllers/dashboardController.js'

const dashboardRouter = Router()

dashboardRouter.get('/', dashboardController.buscarResumo)

export default dashboardRouter
