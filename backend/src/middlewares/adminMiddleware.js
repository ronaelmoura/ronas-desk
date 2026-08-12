import usuarioModel from '../models/usuarioModel.js'

export default async function adminMiddleware(request, response, next) {
  try {
    const usuario = await usuarioModel.buscarPorId(request.usuario.id)

    if (
      !usuario?.ativo ||
      usuario.is_demo ||
      usuario.cargo !== 'Administrador'
    ) {
      return response.status(403).json({
        status: 'erro',
        message: 'Apenas administradores podem executar esta ação.',
      })
    }

    request.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    }

    return next()
  } catch (error) {
    console.error('Erro ao validar permissão administrativa:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível validar a permissão do usuário.',
    })
  }
}
