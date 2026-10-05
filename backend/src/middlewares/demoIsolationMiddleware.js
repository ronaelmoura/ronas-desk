import authMiddleware from './authMiddleware.js'
import usuarioModel from '../models/usuarioModel.js'
import demoRouter from '../routes/demo.routes.js'

export default function demoIsolationMiddleware(request, response, next) {
  if (!request.headers.authorization) return next()

  return authMiddleware(request, response, async () => {
    try {
      // A classificação vem do banco, nunca de uma declaração no token.
      const usuario = await usuarioModel.buscarPorId(request.usuario.id)
      if (!usuario?.is_demo) return next()
      if (!usuario.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: 'Sessão inválida ou expirada.',
        })
      }
      response.set('Cache-Control', 'private, no-store')
      return demoRouter(request, response, next)
    } catch (error) {
      return next(error)
    }
  })
}
