import clienteModel from '../models/clienteModel.js'

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function prepararDados(dadosRecebidos, ativoPadrao = true) {
  const dados = dadosRecebidos ?? {}

  const nome = typeof dados.nome === 'string'
    ? dados.nome.trim()
    : ''
  const email = typeof dados.email === 'string'
    ? dados.email.trim().toLowerCase()
    : ''
  const telefone = typeof dados.telefone === 'string'
    ? dados.telefone.trim() || null
    : dados.telefone ?? null
  const empresa = typeof dados.empresa === 'string'
    ? dados.empresa.trim() || null
    : dados.empresa ?? null
  const ativo = dados.ativo ?? ativoPadrao

  if (!nome || !email) {
    return {
      erro: 'Nome e email são obrigatórios.',
    }
  }

  if (nome.length > 150) {
    return {
      erro: 'Nome deve ter no máximo 150 caracteres.',
    }
  }

  if (email.length > 254 || !validarEmail(email)) {
    return {
      erro: 'Email inválido.',
    }
  }

  if (
    telefone !== null &&
    (typeof telefone !== 'string' || telefone.length > 20)
  ) {
    return {
      erro: 'Telefone deve ter no máximo 20 caracteres.',
    }
  }

  if (
    empresa !== null &&
    (typeof empresa !== 'string' || empresa.length > 150)
  ) {
    return {
      erro: 'Empresa deve ter no máximo 150 caracteres.',
    }
  }

  if (typeof ativo !== 'boolean') {
    return {
      erro: 'Ativo deve ser um valor booleano.',
    }
  }

  return {
    dados: {
      nome,
      email,
      telefone,
      empresa,
      ativo,
    },
  }
}

function responderErroBanco(error, response, mensagem) {
  if (error?.code === 'ER_DUP_ENTRY') {
    return response.status(409).json({
      status: 'erro',
      message: 'Já existe um cliente com este email.',
    })
  }

  console.error(mensagem, error)

  return response.status(500).json({
    status: 'erro',
    message: 'Não foi possível concluir a operação.',
  })
}

async function listar(request, response) {
  try {
    const clientes = await clienteModel.listar()

    return response.status(200).json(clientes)
  } catch (error) {
    return responderErroBanco(
      error,
      response,
      'Erro ao listar clientes:',
    )
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
    const cliente = await clienteModel.buscarPorId(id)

    if (!cliente) {
      return response.status(404).json({
        status: 'erro',
        message: 'Cliente não encontrado.',
      })
    }

    return response.status(200).json(cliente)
  } catch (error) {
    return responderErroBanco(
      error,
      response,
      'Erro ao buscar cliente:',
    )
  }
}

async function criar(request, response) {
  const resultadoValidacao = prepararDados(request.body)

  if (resultadoValidacao.erro) {
    return response.status(400).json({
      status: 'erro',
      message: resultadoValidacao.erro,
    })
  }

  try {
    const cliente = await clienteModel.criar(
      resultadoValidacao.dados,
    )

    return response.status(201).json(cliente)
  } catch (error) {
    return responderErroBanco(
      error,
      response,
      'Erro ao criar cliente:',
    )
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

  const resultadoValidacao = prepararDados(request.body)

  if (resultadoValidacao.erro) {
    return response.status(400).json({
      status: 'erro',
      message: resultadoValidacao.erro,
    })
  }

  try {
    const cliente = await clienteModel.atualizar(
      id,
      resultadoValidacao.dados,
    )

    if (!cliente) {
      return response.status(404).json({
        status: 'erro',
        message: 'Cliente não encontrado.',
      })
    }

    return response.status(200).json(cliente)
  } catch (error) {
    return responderErroBanco(
      error,
      response,
      'Erro ao atualizar cliente:',
    )
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
    const clienteDesativado = await clienteModel.desativar(id)

    if (!clienteDesativado) {
      return response.status(404).json({
        status: 'erro',
        message: 'Cliente não encontrado.',
      })
    }

    return response.status(200).json({
      status: 'sucesso',
      message: 'Cliente desativado com sucesso.',
    })
  } catch (error) {
    return responderErroBanco(
      error,
      response,
      'Erro ao desativar cliente:',
    )
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir,
}
