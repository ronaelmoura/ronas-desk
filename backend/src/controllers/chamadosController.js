import chamadoModel from '../models/chamadoModel.js'

async function listar(request, response) {
  try {
    const chamados = await chamadoModel.listar()

    return response.status(200).json(chamados)
  } catch (error) {
    console.error('Erro ao listar chamados:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível listar os chamados.',
    })
  }
}
async function buscarPorId(request, response) {
  const id = Number(request.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  try {
    const chamado = await chamadoModel.buscarPorId(id)

    if (!chamado) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    return response.status(200).json(chamado)
  } catch (error) {
    console.error('Erro ao buscar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível buscar o chamado.',
    })
  }
}
export default {
  listar,
  buscarPorId,
}