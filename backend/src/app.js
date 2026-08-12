import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import chamadosRouter from './routes/chamados.routes.js'
import clientesRouter from './routes/clientes.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import authRouter from './routes/auth.routes.js'
import usuariosRouter from './routes/usuarios.routes.js'
import relatoriosRouter from './routes/relatorios.routes.js'
import visitasRouter from './routes/visitas.routes.js'
import configuracaoEmpresaRouter from './routes/configuracaoEmpresa.routes.js'
import portalClienteRouter from './routes/portalCliente.routes.js'
import authMiddleware from './middlewares/authMiddleware.js'
import demoReadOnlyMiddleware from './middlewares/demoReadOnlyMiddleware.js'
import equipeMiddleware from './middlewares/equipeMiddleware.js'
import portalClienteMiddleware from './middlewares/portalClienteMiddleware.js'
import { criarLimitadorLogin } from './middlewares/loginRateLimitMiddleware.js'
import { criarHealthController } from './controllers/healthController.js'
import { criarConfiguracaoSeguranca } from './config/security.js'
import pool from './database/db.js'

export function criarApp({ database = pool, variaveis = process.env } = {}) {
  const app = express()
  const configuracaoSeguranca = criarConfiguracaoSeguranca(variaveis)
  const corsOrigin =
    variaveis.CORS_ORIGIN ||
    (variaveis.NODE_ENV === 'production' ? null : 'http://localhost:5173')
  const frontendDistPath = variaveis.FRONTEND_DIST_PATH
  const frontendIndexPath = frontendDistPath
    ? path.join(frontendDistPath, 'index.html')
    : null

  if (configuracaoSeguranca.trustProxy !== false) {
    app.set('trust proxy', configuracaoSeguranca.trustProxy)
  }

  app.use(helmet(configuracaoSeguranca.helmet))

  if (corsOrigin) {
    app.use(
      cors({
        origin: corsOrigin,
      }),
    )
  }

  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', criarHealthController(database))
  app.use(
    '/api/auth/login',
    criarLimitadorLogin(configuracaoSeguranca.loginRateLimit),
  )
  app.use(
    '/api/auth/demo',
    criarLimitadorLogin(configuracaoSeguranca.loginRateLimit, {
      ignorarSucessos: false,
    }),
  )
  app.use('/api/auth', authRouter)
  app.use('/api/visitas', visitasRouter)
  app.use('/api/configuracao-empresa', configuracaoEmpresaRouter)
  app.use(
    '/api/chamados',
    authMiddleware,
    demoReadOnlyMiddleware,
    equipeMiddleware,
    chamadosRouter,
  )
  app.use(
    '/api/clientes',
    authMiddleware,
    demoReadOnlyMiddleware,
    equipeMiddleware,
    clientesRouter,
  )
  app.use('/api/dashboard', authMiddleware, equipeMiddleware, dashboardRouter)
  app.use(
    '/api/usuarios',
    authMiddleware,
    demoReadOnlyMiddleware,
    equipeMiddleware,
    usuariosRouter,
  )
  app.use('/api/relatorios', authMiddleware, equipeMiddleware, relatoriosRouter)
  app.use(
    '/api/portal',
    authMiddleware,
    portalClienteMiddleware,
    portalClienteRouter,
  )

  app.use('/api', (request, response) => {
    response.status(404).json({
      status: 'erro',
      message: 'Rota não encontrada.',
    })
  })

  if (frontendDistPath) {
    app.use(express.static(frontendDistPath))

    app.use((request, response, next) => {
      if (request.method !== 'GET') {
        return next()
      }

      return response.sendFile(frontendIndexPath)
    })
  }

  app.use((request, response) => {
    response.status(404).json({
      status: 'erro',
      message: 'Rota não encontrada.',
    })
  })

  return app
}
