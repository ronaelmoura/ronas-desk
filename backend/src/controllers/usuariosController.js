import bcrypt from 'bcryptjs'
import usuarioModel from '../models/usuarioModel.js'

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

  if (senha && (senha.length < 8 || senha.length > 200)) {
    return { erro: 'Senha deve ter entre 8 e 200 caracteres.' }
  }

  return { dados: { nome, email, cargo, senha } }
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
