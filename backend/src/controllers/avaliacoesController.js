import avaliacaoModel from '../models/avaliacaoModel.js'
import chamadoModel from '../models/chamadoModel.js'

function validarNota(nota) {
  return Number.isInteger(nota) && nota >= 1 && nota <= 5
}

function prepararAvaliacao(dados = {}) {
  const nota = Number(dados.nota)
  const comentario =
    typeof dados.comentario === 'string' ? dados.comentario.trim() : ''

  if (!validarNota(nota)) {
    return { erro: 'Escolha uma nota de 1 a 5.' }
  }

  if (comentario.length > 1000) {
    return { erro: 'O comentário deve ter no máximo 1000 caracteres.' }
  }

  return { dados: { nota, comentario } }
}

async function obterChamadoEncerrado(id, clienteId, response) {
  const chamado = await chamadoModel.buscarPorIdDoCliente(id, clienteId)

  if (!chamado) {
    response
      .status(404)
      .json({ status: 'erro', message: 'Chamado não encontrado.' })
    return null
  }

  if (!['Resolvido', 'Fechado'].includes(chamado.status)) {
    response.status(409).json({
      status: 'erro',
      message: 'A avaliação fica disponível após a resolução do chamado.',
    })
    return null
  }

  return chamado
}

async function buscarDoPortal(request, response) {
  const chamadoId = Number(request.params.id)
  if (!Number.isInteger(chamadoId) || chamadoId <= 0) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  try {
    const chamado = await chamadoModel.buscarPorIdDoCliente(
      chamadoId,
      request.usuario.cliente_id,
    )
    if (!chamado) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    return response
      .status(200)
      .json(
        await avaliacaoModel.buscarPorChamadoCliente(
          chamadoId,
          request.usuario.cliente_id,
        ),
      )
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar a avaliação.',
    })
  }
}

async function criarDoPortal(request, response) {
  const chamadoId = Number(request.params.id)
  const validacao = prepararAvaliacao(request.body)
  if (!Number.isInteger(chamadoId) || chamadoId <= 0) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }
  if (validacao.erro) {
    return response
      .status(400)
      .json({ status: 'erro', message: validacao.erro })
  }

  try {
    if (
      !(await obterChamadoEncerrado(
        chamadoId,
        request.usuario.cliente_id,
        response,
      ))
    ) {
      return
    }

    const existente = await avaliacaoModel.buscarPorChamadoCliente(
      chamadoId,
      request.usuario.cliente_id,
    )
    if (existente) {
      return response.status(409).json({
        status: 'erro',
        message: 'Este chamado já foi avaliado.',
      })
    }

    const avaliacao = await avaliacaoModel.criar({
      chamado_id: chamadoId,
      cliente_id: request.usuario.cliente_id,
      ...validacao.dados,
    })
    return response.status(201).json(avaliacao)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({
        status: 'erro',
        message: 'Este chamado já foi avaliado.',
      })
    }

    console.error('Erro ao registrar avaliação:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível registrar a avaliação.',
    })
  }
}

async function listarParaAdministracao(request, response) {
  try {
    const [avaliacoes, resumo] = await Promise.all([
      avaliacaoModel.listarParaAdministracao(),
      avaliacaoModel.obterResumo(),
    ])
    return response.status(200).json({ avaliacoes, resumo })
  } catch (error) {
    console.error('Erro ao listar avaliações:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar as avaliações.',
    })
  }
}

export default { buscarDoPortal, criarDoPortal, listarParaAdministracao }
