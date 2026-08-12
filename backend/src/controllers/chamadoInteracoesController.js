import pool from '../database/db.js'
import historyService from '../services/historyService.js'
import primeiraRespostaService from '../services/primeiraRespostaService.js'
import chamadoModel from '../models/chamadoModel.js'
import comentarioModel from '../models/comentarioModel.js'
import notificacaoService from '../services/notificacaoService.js'

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

async function obterChamado(id, response) {
  if (!validarId(id)) {
    response.status(400).json({ status: 'erro', message: 'ID inválido.' })
    return null
  }

  const chamado = await chamadoModel.buscarPorId(id)

  if (!chamado) {
    response
      .status(404)
      .json({ status: 'erro', message: 'Chamado não encontrado.' })
    return null
  }

  return chamado
}

async function listarTimeline(request, response) {
  return listarHistorico(request, response)
}

async function listarHistorico(request, response) {
  const id = Number(request.params.id)

  try {
    if (!(await obterChamado(id, response))) return
    return response.status(200).json(await historyService.listarPorChamado(id))
  } catch (error) {
    console.error('Erro ao listar histórico do chamado:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar o histórico.',
    })
  }
}

async function listarComentarios(request, response) {
  const id = Number(request.params.id)

  try {
    if (!(await obterChamado(id, response))) return
    return response.status(200).json(await comentarioModel.listarPorChamado(id))
  } catch (error) {
    console.error('Erro ao listar comentários do chamado:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar os comentários.',
    })
  }
}

async function criarComentario(request, response) {
  const id = Number(request.params.id)
  const tipo =
    typeof request.body?.tipo === 'string'
      ? request.body.tipo.trim().toUpperCase()
      : 'INTERNO'
  const conteudo =
    typeof request.body?.conteudo === 'string'
      ? request.body.conteudo.trim()
      : ''

  if (!conteudo || conteudo.length > 2000) {
    return response.status(400).json({
      status: 'erro',
      message: 'O comentário deve ter entre 1 e 2000 caracteres.',
    })
  }

  if (!['PUBLICO', 'INTERNO'].includes(tipo)) {
    return response.status(400).json({
      status: 'erro',
      message: 'O tipo do comentário deve ser PUBLICO ou INTERNO.',
    })
  }

  let conexao

  try {
    const chamado = await obterChamado(id, response)
    if (!chamado) return

    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    const comentario = await comentarioModel.criar(
      { chamado_id: id, usuario_id: request.usuario.id, conteudo, tipo },
      conexao,
    )

    await primeiraRespostaService.registrarSeAplicavel(id, comentario, conexao)

    await historyService.registrarComentario(
      id,
      comentario,
      request.usuario.id,
      conexao,
    )

    if (comentario.tipo === 'PUBLICO') {
      await notificacaoService.comentarioDaEquipe(chamado, conexao)
    }

    await conexao.commit()
    return response.status(201).json(comentario)
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao adicionar comentário:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível adicionar o comentário.',
    })
  } finally {
    conexao?.release()
  }
}

export default {
  listarTimeline,
  listarHistorico,
  listarComentarios,
  criarComentario,
}
