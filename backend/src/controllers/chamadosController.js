import chamadoModel from '../models/chamadoModel.js'
import pool from '../database/db.js'
import auditoriaService from '../services/auditoriaService.js'

const categoriasPermitidas = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']

const prioridadesPermitidas = ['Crítica', 'Alta', 'Média', 'Baixa']

const statusPermitidos = [
  'Novo',
  'Em Atendimento',
  'Aguardando Cliente',
  'Resolvido',
  'Fechado',
  'Cancelado',
]

const camposInformacoes = ['cliente_id', 'titulo', 'descricao', 'categoria']

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

function validarChamado(dados) {
  const {
    cliente_id,
    responsavel_id,
    titulo,
    descricao,
    categoria,
    prioridade,
    status,
  } = dados

  if (!validarId(Number(cliente_id))) {
    return 'Selecione um cliente válido.'
  }

  if (responsavel_id !== null && !validarId(Number(responsavel_id))) {
    return 'Selecione um responsável válido.'
  }

  if (!titulo?.trim() || !descricao?.trim() || !categoria || !prioridade) {
    return 'Título, descrição, categoria e prioridade são obrigatórios.'
  }

  if (!categoriasPermitidas.includes(categoria)) {
    return 'Categoria inválida.'
  }

  if (!prioridadesPermitidas.includes(prioridade)) {
    return 'Prioridade inválida.'
  }

  if (status && !statusPermitidos.includes(status)) {
    return 'Status inválido.'
  }

  return null
}

function normalizarResponsavelId(responsavelId) {
  return responsavelId === null ||
    responsavelId === '' ||
    responsavelId === undefined
    ? null
    : Number(responsavelId)
}

async function validarRelacionamentos(dados, response) {
  const cliente = await chamadoModel.buscarClienteAtivo(dados.cliente_id)

  if (!cliente) {
    response.status(400).json({
      status: 'erro',
      message: 'Cliente não encontrado ou inativo.',
    })
    return false
  }

  if (dados.responsavel_id !== null) {
    const responsavel = await chamadoModel.buscarResponsavelAtivo(
      dados.responsavel_id,
    )

    if (!responsavel) {
      response.status(400).json({
        status: 'erro',
        message: 'Responsável não encontrado ou inativo.',
      })
      return false
    }
  }

  return true
}

function criarEventosAtualizacao(anterior, atual, usuarioId) {
  const eventoBase = {
    entidade: 'chamado',
    entidade_id: anterior.id,
    usuario_id: usuarioId,
  }
  const eventos = []

  if (camposInformacoes.some((campo) => anterior[campo] !== atual[campo])) {
    eventos.push({
      ...eventoBase,
      acao: 'edicao',
      descricao: 'Informações do chamado atualizadas.',
    })
  }

  if (anterior.status !== atual.status) {
    eventos.push({
      ...eventoBase,
      acao: 'alteracao_status',
      campo: 'status',
      valor_anterior: anterior.status,
      valor_novo: atual.status,
      descricao: 'Status alterado.',
    })
  }

  if (anterior.prioridade !== atual.prioridade) {
    eventos.push({
      ...eventoBase,
      acao: 'alteracao_prioridade',
      campo: 'prioridade',
      valor_anterior: anterior.prioridade,
      valor_novo: atual.prioridade,
      descricao: 'Prioridade alterada.',
    })
  }

  if (anterior.responsavel_id !== atual.responsavel_id) {
    eventos.push({
      ...eventoBase,
      acao: 'alteracao_responsavel',
      campo: 'responsavel',
      valor_anterior: anterior.responsavel_nome || 'Não atribuído',
      valor_novo: atual.responsavel_nome || 'Não atribuído',
      descricao: 'Responsável alterado.',
    })
  }

  return eventos
}

async function registrarEventos(eventos, conexao) {
  for (const evento of eventos) {
    await auditoriaService.registrar(evento, conexao)
  }
}

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

  if (!validarId(id)) {
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

async function criar(request, response) {
  const dados = {
    cliente_id: Number(request.body.cliente_id),
    responsavel_id: normalizarResponsavelId(request.body.responsavel_id),
    titulo: request.body.titulo,
    descricao: request.body.descricao,
    categoria: request.body.categoria,
    prioridade: request.body.prioridade,
    status: request.body.status || 'Novo',
  }

  const erro = validarChamado(dados)

  if (erro) {
    return response.status(400).json({
      status: 'erro',
      message: erro,
    })
  }

  let conexao

  try {
    if (!(await validarRelacionamentos(dados, response))) return

    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    const chamado = await chamadoModel.criar(
      {
        ...dados,
        titulo: dados.titulo.trim(),
        descricao: dados.descricao.trim(),
      },
      conexao,
    )

    await auditoriaService.registrar(
      {
        entidade: 'chamado',
        entidade_id: chamado.id,
        usuario_id: request.usuario.id,
        acao: 'criacao',
        descricao: 'Chamado criado.',
      },
      conexao,
    )

    await conexao.commit()
    return response.status(201).json(chamado)
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao criar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível criar o chamado.',
    })
  } finally {
    conexao?.release()
  }
}

async function atualizar(request, response) {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  let conexao

  try {
    const chamadoExistente = await chamadoModel.buscarPorId(id)

    if (!chamadoExistente) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    const responsavelRecebido = Object.prototype.hasOwnProperty.call(
      request.body,
      'responsavel_id',
    )
      ? request.body.responsavel_id
      : chamadoExistente.responsavel_id

    const dadosAtualizados = {
      ...chamadoExistente,
      ...request.body,
      cliente_id: Number(
        request.body.cliente_id ?? chamadoExistente.cliente_id,
      ),
      responsavel_id: normalizarResponsavelId(responsavelRecebido),
    }

    const erro = validarChamado(dadosAtualizados)

    if (erro) {
      return response.status(400).json({
        status: 'erro',
        message: erro,
      })
    }

    if (!(await validarRelacionamentos(dadosAtualizados, response))) return

    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    const chamado = await chamadoModel.atualizar(
      id,
      {
        cliente_id: dadosAtualizados.cliente_id,
        responsavel_id: dadosAtualizados.responsavel_id,
        titulo: dadosAtualizados.titulo.trim(),
        descricao: dadosAtualizados.descricao.trim(),
        categoria: dadosAtualizados.categoria,
        prioridade: dadosAtualizados.prioridade,
        status: dadosAtualizados.status,
      },
      conexao,
    )

    await registrarEventos(
      criarEventosAtualizacao(chamadoExistente, chamado, request.usuario.id),
      conexao,
    )

    await conexao.commit()
    return response.status(200).json(chamado)
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao atualizar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível atualizar o chamado.',
    })
  } finally {
    conexao?.release()
  }
}

async function excluir(request, response) {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  let conexao

  try {
    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    const chamado = await chamadoModel.excluir(id, conexao)

    if (!chamado) {
      await conexao.rollback()
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    await auditoriaService.registrar(
      {
        entidade: 'chamado',
        entidade_id: id,
        usuario_id: request.usuario.id,
        acao: 'exclusao',
        descricao: 'Chamado excluído.',
      },
      conexao,
    )

    await conexao.commit()

    return response.status(200).json({
      status: 'sucesso',
      message: 'Chamado excluído com sucesso.',
      chamado,
    })
  } catch (error) {
    if (conexao) await conexao.rollback()
    console.error('Erro ao excluir chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível excluir o chamado.',
    })
  } finally {
    conexao?.release()
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir,
}
