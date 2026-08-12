import usuarioModel from '../models/usuarioModel.js'

export function criarDemoReadOnlyMiddleware({ usuarios = usuarioModel } = {}) {
  return async function demoReadOnlyMiddleware(request, response, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next()
    }

    try {
      const usuario = await usuarios.buscarPorId(request.usuario.id)

      if (!usuario?.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: 'Sessão inválida ou expirada.',
        })
      }

      if (usuario.is_demo) {
        return response.status(403).json({
          status: 'erro',
          code: 'DEMO_READ_ONLY',
          message:
            'A conta de demonstração permite apenas visualizar os dados.',
        })
      }

      return next()
    } catch (error) {
      console.error('Erro ao validar conta de demonstração:', error)

      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível validar a permissão do usuário.',
      })
    }
  }
}

export default criarDemoReadOnlyMiddleware()
