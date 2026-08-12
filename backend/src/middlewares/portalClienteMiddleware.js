import clienteModel from '../models/clienteModel.js'
import usuarioModel from '../models/usuarioModel.js'

export function criarPortalClienteMiddleware({
  usuarios = usuarioModel,
  clientes = clienteModel,
} = {}) {
  return async function portalClienteMiddleware(request, response, next) {
    try {
      const usuario = await usuarios.buscarPorId(request.usuario.id)

      if (!usuario?.ativo || usuario.is_demo || usuario.cargo !== 'Cliente') {
        return response.status(403).json({
          status: 'erro',
          message: 'Esta área é exclusiva para clientes cadastrados.',
        })
      }

      const cliente = await clientes.buscarPorId(usuario.cliente_id)

      if (!cliente) {
        return response.status(403).json({
          status: 'erro',
          message: 'A conta do cliente não possui um cadastro ativo vinculado.',
        })
      }

      request.usuario = {
        ...request.usuario,
        cargo: usuario.cargo,
        cliente_id: cliente.id,
      }
      request.cliente = cliente
      return next()
    } catch (error) {
      console.error('Erro ao validar acesso do cliente:', error)
      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível validar o acesso do cliente.',
      })
    }
  }
}

export default criarPortalClienteMiddleware()
