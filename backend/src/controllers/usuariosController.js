import bcrypt from 'bcryptjs'
import usuarioModel from '../models/usuarioModel.js'
import clienteModel from '../models/clienteModel.js'

const cargosPermitidos = new Set(['Administrador', 'Atendente', 'Cliente'])

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function exigirAdministrador(request, response) {
  if (request.usuario?.cargo === 'Administrador') {
    return true
  }

  response.status(403).json({
    status: 'erro',
    message: 'Apenas administradores podem gerenciar usuários.',
  })

  return false
}

function prepararDados(dadosRecebidos, senhaObrigatoria) {
  const dados = dadosRecebidos ?? {}
  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
  const email =
    typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : ''
  const cargo = typeof dados.cargo === 'string' ? dados.cargo.trim() : ''
  const senha = typeof dados.senha === 'string' ? dados.senha : ''
  const clienteId =
    dados.cliente_id === null ||
    dados.cliente_id === '' ||
    dados.cliente_id === undefined
      ? null
      : Number(dados.cliente_id)

  if (!nome || !email || !cargo || (senhaObrigatoria && !senha)) {
    return { erro: 'Nome, email, cargo e senha são obrigatórios.' }
  }

  if (nome.length > 120) {
    return { erro: 'Nome deve ter no máximo 120 caracteres.' }
  }

  if (email.length > 160 || !validarEmail(email)) {
    return { erro: 'Email inválido.' }
  }

  if (cargo.length > 50) {
    return { erro: 'Cargo deve ter no máximo 50 caracteres.' }
  }

  if (!cargosPermitidos.has(cargo)) {
    return { erro: 'Cargo inválido.' }
  }

  if (cargo === 'Cliente' && !validarId(clienteId)) {
    return { erro: 'Selecione o cliente vinculado à conta.' }
  }

  if (cargo !== 'Cliente' && clienteId !== null) {
    return { erro: 'Apenas contas de cliente podem ter um cliente vinculado.' }
  }

  if (senha && (senha.length < 8 || senha.length > 200)) {
    return { erro: 'Senha deve ter entre 8 e 200 caracteres.' }
  }

  return { dados: { nome, email, cargo, senha, cliente_id: clienteId } }
}

async function validarClienteVinculado(dados) {
  if (dados.cargo !== 'Cliente') return null

  const cliente = await clienteModel.buscarPorId(dados.cliente_id)
  if (!cliente) return 'Cliente não encontrado ou inativo.'

  if (cliente.email.toLowerCase() !== dados.email) {
    return 'O email da conta deve ser o mesmo do cliente vinculado.'
  }

  return null
}

async function validarContaClienteUnica(clienteId, usuarioId = null) {
  if (clienteId === null) return null

  const usuarioVinculado = await usuarioModel.buscarPorClienteId(clienteId)

  if (usuarioVinculado && usuarioVinculado.id !== usuarioId) {
    return 'Este cliente já possui uma conta de acesso vinculada.'
  }

  return null
}

function responderErro(error, response, contexto) {
  if (error?.code === 'ER_DUP_ENTRY') {
    return response.status(409).json({
      status: 'erro',
      message: 'Já existe um usuário com este email.',
    })
  }

  console.error(contexto, error)

  return response.status(500).json({
    status: 'erro',
    message: 'Não foi possível concluir a operação.',
  })
}

async function listar(request, response) {
  try {
    return response.status(200).json(await usuarioModel.listar())
  } catch (error) {
    return responderErro(error, response, 'Erro ao listar usuários:')
  }
}

async function buscarPorId(request, response) {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  try {
    const usuario = await usuarioModel.buscarPorId(id)

    if (!usuario) {
      return response
        .status(404)
        .json({ status: 'erro', message: 'Usuário não encontrado.' })
    }

    return response.status(200).json(usuario)
  } catch (error) {
    return responderErro(error, response, 'Erro ao buscar usuário:')
  }
}

async function criar(request, response) {
  if (!exigirAdministrador(request, response)) return

  const validacao = prepararDados(request.body, true)

  if (validacao.erro) {
    return response
      .status(400)
      .json({ status: 'erro', message: validacao.erro })
  }

  try {
    const erroCliente = await validarClienteVinculado(validacao.dados)
    if (erroCliente) {
      return response.status(400).json({ status: 'erro', message: erroCliente })
    }

    const erroContaCliente = await validarContaClienteUnica(
      validacao.dados.cliente_id,
    )
    if (erroContaCliente) {
      return response
        .status(409)
        .json({ status: 'erro', message: erroContaCliente })
    }

    const usuarioExistente = await usuarioModel.buscarPorEmail(
      validacao.dados.email,
    )

    if (usuarioExistente) {
      return response.status(409).json({
        status: 'erro',
        message: 'Já existe um usuário com este email.',
      })
    }

    const senha_hash = await bcrypt.hash(validacao.dados.senha, 12)
    const usuario = await usuarioModel.criar({
      ...validacao.dados,
      senha_hash,
    })

    return response.status(201).json(usuario)
  } catch (error) {
    return responderErro(error, response, 'Erro ao criar usuário:')
  }
}

async function atualizar(request, response) {
  if (!exigirAdministrador(request, response)) return

  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  const validacao = prepararDados(request.body, false)

  if (validacao.erro) {
    return response
      .status(400)
      .json({ status: 'erro', message: validacao.erro })
  }

  try {
    const usuarioAtual = await usuarioModel.buscarPorId(id)

    if (!usuarioAtual) {
      return response
        .status(404)
        .json({ status: 'erro', message: 'Usuário não encontrado.' })
    }

    const usuarioComEmail = await usuarioModel.buscarPorEmail(
      validacao.dados.email,
    )

    if (usuarioComEmail && usuarioComEmail.id !== id) {
      return response.status(409).json({
        status: 'erro',
        message: 'Já existe um usuário com este email.',
      })
    }

    const erroCliente = await validarClienteVinculado(validacao.dados)
    if (erroCliente) {
      return response.status(400).json({ status: 'erro', message: erroCliente })
    }

    const erroContaCliente = await validarContaClienteUnica(
      validacao.dados.cliente_id,
      id,
    )
    if (erroContaCliente) {
      return response
        .status(409)
        .json({ status: 'erro', message: erroContaCliente })
    }

    const senha_hash = validacao.dados.senha
      ? await bcrypt.hash(validacao.dados.senha, 12)
      : null
    const usuario = await usuarioModel.atualizar(id, {
      ...validacao.dados,
      senha_hash,
    })

    return response.status(200).json(usuario)
  } catch (error) {
    return responderErro(error, response, 'Erro ao atualizar usuário:')
  }
}

async function alterarStatus(request, response) {
  if (!exigirAdministrador(request, response)) return

  const id = Number(request.params.id)
  const ativo = request.body?.ativo

  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  if (typeof ativo !== 'boolean') {
    return response.status(400).json({
      status: 'erro',
      message: 'O status ativo deve ser booleano.',
    })
  }

  if (id === request.usuario.id && !ativo) {
    return response.status(400).json({
      status: 'erro',
      message: 'Você não pode desativar a própria conta.',
    })
  }

  try {
    const usuario = await usuarioModel.alterarStatus(id, ativo)

    if (!usuario) {
      return response
        .status(404)
        .json({ status: 'erro', message: 'Usuário não encontrado.' })
    }

    return response.status(200).json(usuario)
  } catch (error) {
    return responderErro(error, response, 'Erro ao alterar status do usuário:')
  }
}

async function excluir(request, response) {
  if (!exigirAdministrador(request, response)) return

  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  if (id === request.usuario.id) {
    return response.status(400).json({
      status: 'erro',
      message: 'Você não pode excluir a própria conta.',
    })
  }

  try {
    const usuarioExcluido = await usuarioModel.excluir(id)

    if (!usuarioExcluido) {
      return response
        .status(404)
        .json({ status: 'erro', message: 'Usuário não encontrado.' })
    }

    return response.status(200).json({
      status: 'sucesso',
      message: 'Usuário excluído com sucesso.',
    })
  } catch (error) {
    return responderErro(error, response, 'Erro ao excluir usuário:')
  }
}

export default {
  listar,
  buscarPorId,
  criar,
  atualizar,
  alterarStatus,
  excluir,
}
