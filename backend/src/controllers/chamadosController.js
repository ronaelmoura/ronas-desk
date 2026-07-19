import chamadoModel from '../models/chamadoModel.js'

const categoriasPermitidas = [
  'Hardware',
  'Software',
  'Rede',
  'Acesso',
  'Outro',
]

const prioridadesPermitidas = [
  'Baixa',
  'Média',
  'Alta',
]

const statusPermitidos = [
  'Aberto',
  'Em andamento',
  'Concluído',
]

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

function validarChamado(dados) {
  const {
    cliente_id,
    titulo,
    descricao,
    categoria,
    prioridade,
    status,
  } = dados

  if (!validarId(Number(cliente_id))) {
    return 'Selecione um cliente válido.'
  }

  if (
    !titulo?.trim() ||
    !descricao?.trim() ||
    !categoria ||
    !prioridade
  ) {
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
    titulo: request.body.titulo,
    descricao: request.body.descricao,
    categoria: request.body.categoria,
    prioridade: request.body.prioridade,
    status: request.body.status || 'Aberto',
  }

  const erro = validarChamado(dados)

  if (erro) {
    return response.status(400).json({
      status: 'erro',
      message: erro,
    })
  }

  try {
    const cliente = await chamadoModel.buscarClienteAtivo(
      dados.cliente_id,
    )

    if (!cliente) {
      return response.status(400).json({
        status: 'erro',
        message: 'Cliente não encontrado ou inativo.',
      })
    }

    const chamado = await chamadoModel.criar({
      ...dados,
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
    })

    return response.status(201).json(chamado)
  } catch (error) {
    console.error('Erro ao criar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível criar o chamado.',
    })
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

  try {
    const chamadoExistente = await chamadoModel.buscarPorId(id)

    if (!chamadoExistente) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    const dadosAtualizados = {
      ...chamadoExistente,
      ...request.body,
      cliente_id: Number(
        request.body.cliente_id ?? chamadoExistente.cliente_id,
      ),
    }

    const erro = validarChamado(dadosAtualizados)

    if (erro) {
      return response.status(400).json({
        status: 'erro',
        message: erro,
      })
    }

    const cliente = await chamadoModel.buscarClienteAtivo(
      dadosAtualizados.cliente_id,
    )

    if (!cliente) {
      return response.status(400).json({
        status: 'erro',
        message: 'Cliente não encontrado ou inativo.',
      })
    }

    const chamado = await chamadoModel.atualizar(id, {
      cliente_id: dadosAtualizados.cliente_id,
      titulo: dadosAtualizados.titulo.trim(),
      descricao: dadosAtualizados.descricao.trim(),
      categoria: dadosAtualizados.categoria,
      prioridade: dadosAtualizados.prioridade,
      status: dadosAtualizados.status,
    })

    return response.status(200).json(chamado)
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível atualizar o chamado.',
    })
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

  try {
    const chamado = await chamadoModel.excluir(id)

    if (!chamado) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    return response.status(200).json({
      status: 'sucesso',
      message: 'Chamado excluído com sucesso.',
      chamado,
    })
  } catch (error) {
    console.error('Erro ao excluir chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível excluir o chamado.',
    })
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir,
}