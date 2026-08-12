import notificacaoModel from '../models/notificacaoModel.js'

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

async function listar(request, response) {
  try {
    const [notificacoes, naoLidas] = await Promise.all([
      notificacaoModel.listarPorUsuario(request.usuario.id),
      notificacaoModel.contarNaoLidas(request.usuario.id),
    ])

    return response.status(200).json({ notificacoes, naoLidas })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar as notificações.',
    })
  }
}

async function marcarComoLida(request, response) {
  const id = Number(request.params.id)
  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  try {
    const atualizada = await notificacaoModel.marcarComoLida(
      id,
      request.usuario.id,
    )
    if (!atualizada) {
      return response.status(404).json({
        status: 'erro',
        message: 'Notificação não encontrada.',
      })
    }

    return response.status(204).send()
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível atualizar a notificação.',
    })
  }
}

async function marcarTodasComoLidas(request, response) {
  try {
    await notificacaoModel.marcarTodasComoLidas(request.usuario.id)
    return response.status(204).send()
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível atualizar as notificações.',
    })
  }
}

export default { listar, marcarComoLida, marcarTodasComoLidas }
