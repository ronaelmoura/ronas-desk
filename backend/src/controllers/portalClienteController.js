import pool from '../database/db.js'
import chamadoModel from '../models/chamadoModel.js'
import comentarioModel from '../models/comentarioModel.js'
import historyService from '../services/historyService.js'
import slaService from '../services/slaService.js'
import notificacaoService from '../services/notificacaoService.js'
import reaberturaChamadoService from '../services/reaberturaChamadoService.js'

const categoriasPermitidas = new Set([
  'Hardware',
  'Software',
  'Rede',
  'Acesso',
  'Outro',
])
const prioridadesPermitidas = new Set(['Crítica', 'Alta', 'Média', 'Baixa'])

function idValido(id) {
  return Number.isInteger(id) && id > 0
}

function prepararChamado(dados = {}) {
  const titulo = typeof dados.titulo === 'string' ? dados.titulo.trim() : ''
  const descricao =
    typeof dados.descricao === 'string' ? dados.descricao.trim() : ''
  const categoria = typeof dados.categoria === 'string' ? dados.categoria : ''
  const prioridade =
    typeof dados.prioridade === 'string' ? dados.prioridade : ''

  if (!titulo || !descricao || !categoria || !prioridade) {
    return {
      erro: 'Título, descrição, categoria e prioridade são obrigatórios.',
    }
  }

  if (titulo.length > 200 || descricao.length > 10000) {
    return { erro: 'Título ou descrição excedem o tamanho permitido.' }
  }

  if (
    !categoriasPermitidas.has(categoria) ||
    !prioridadesPermitidas.has(prioridade)
  ) {
    return { erro: 'Categoria ou prioridade inválida.' }
  }

  return { dados: { titulo, descricao, categoria, prioridade } }
}

async function obterChamadoDoCliente(id, clienteId, response) {
  if (!idValido(id)) {
    response.status(400).json({ status: 'erro', message: 'ID inválido.' })
    return null
  }

  const chamado = await chamadoModel.buscarPorIdDoCliente(id, clienteId)
  if (!chamado) {
    response
      .status(404)
      .json({ status: 'erro', message: 'Chamado não encontrado.' })
    return null
  }

  return chamado
}

async function listar(request, response) {
  try {
    const chamados = await chamadoModel.listarPorCliente(
      request.usuario.cliente_id,
    )
    return response.status(200).json(slaService.enriquecerChamados(chamados))
  } catch (error) {
    console.error('Erro ao listar chamados do portal:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar seus chamados.',
    })
  }
}

async function buscarPorId(request, response) {
  try {
    const chamado = await obterChamadoDoCliente(
      Number(request.params.id),
      request.usuario.cliente_id,
      response,
    )
    if (!chamado) return
    return response.status(200).json(slaService.enriquecerChamado(chamado))
  } catch (error) {
    console.error('Erro ao buscar chamado do portal:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar o chamado.',
    })
  }
}

async function criar(request, response) {
  const validacao = prepararChamado(request.body)
  if (validacao.erro) {
    return response
      .status(400)
      .json({ status: 'erro', message: validacao.erro })
  }

  let conexao
  try {
    conexao = await pool.getConnection()
    await conexao.beginTransaction()
    const chamado = await chamadoModel.criar(
      {
        cliente_id: request.usuario.cliente_id,
        responsavel_id: null,
        ...validacao.dados,
        status: 'Novo',
        resolved_at: null,
        sla_started_at: new Date(),
      },
      conexao,
    )
    await historyService.registrarCriacao(chamado, request.usuario.id, conexao)
    await notificacaoService.novoChamado(chamado, request.usuario.id, conexao)
    await conexao.commit()
    return response.status(201).json(slaService.enriquecerChamado(chamado))
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao criar chamado pelo portal:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível abrir o chamado.',
    })
  } finally {
    conexao?.release()
  }
}

async function listarComentarios(request, response) {
  try {
    const chamado = await obterChamadoDoCliente(
      Number(request.params.id),
      request.usuario.cliente_id,
      response,
    )
    if (!chamado) return
    return response
      .status(200)
      .json(await comentarioModel.listarPublicosPorChamado(chamado.id))
  } catch (error) {
    console.error('Erro ao listar comentários do portal:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar as mensagens.',
    })
  }
}

async function criarComentario(request, response) {
  const conteudo =
    typeof request.body?.conteudo === 'string'
      ? request.body.conteudo.trim()
      : ''
  if (!conteudo || conteudo.length > 2000) {
    return response.status(400).json({
      status: 'erro',
      message: 'A mensagem deve ter entre 1 e 2000 caracteres.',
    })
  }

  let conexao
  try {
    conexao = await pool.getConnection()
    await conexao.beginTransaction()
    const chamado = await chamadoModel.buscarPorIdParaAtualizacao(
      Number(request.params.id),
      conexao,
    )
    if (!chamado || chamado.cliente_id !== request.usuario.cliente_id) {
      await conexao.rollback()
      return response
        .status(404)
        .json({ status: 'erro', message: 'Chamado não encontrado.' })
    }

    const chamadoAtualizado =
      await reaberturaChamadoService.aoReceberRespostaCliente(
        chamado,
        request.usuario.id,
        conexao,
      )

    const comentario = await comentarioModel.criar(
      {
        chamado_id: chamado.id,
        usuario_id: request.usuario.id,
        conteudo,
        tipo: 'PUBLICO',
      },
      conexao,
    )
    await historyService.registrarComentario(
      chamado.id,
      comentario,
      request.usuario.id,
      conexao,
    )
    await notificacaoService.comentarioDoCliente(
      chamadoAtualizado,
      request.usuario.id,
      conexao,
    )
    await conexao.commit()
    return response.status(201).json({
      ...comentario,
      chamado: slaService.enriquecerChamado(chamadoAtualizado),
    })
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao enviar comentário do portal:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível enviar a mensagem.',
    })
  } finally {
    conexao?.release()
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  listarComentarios,
  criarComentario,
}
