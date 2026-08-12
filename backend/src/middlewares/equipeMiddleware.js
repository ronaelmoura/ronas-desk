import usuarioModel from '../models/usuarioModel.js'

export function criarEquipeMiddleware({ usuarios = usuarioModel } = {}) {
  return async function equipeMiddleware(request, response, next) {
    try {
      const usuario = await usuarios.buscarPorId(request.usuario.id)

      if (!usuario?.ativo || usuario.cargo === 'Cliente') {
        return response.status(403).json({
          status: 'erro',
          message: 'Esta área é exclusiva para a equipe de atendimento.',
        })
      }

      request.usuario = { ...request.usuario, cargo: usuario.cargo }
      return next()
    } catch (error) {
      console.error('Erro ao validar acesso da equipe:', error)
      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível validar o acesso do usuário.',
      })
    }
  }
}

export default criarEquipeMiddleware()
