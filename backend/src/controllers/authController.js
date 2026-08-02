import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import usuarioModel from '../models/usuarioModel.js'

const mensagemCredenciaisInvalidas = 'Email ou senha inválidos.'
const mensagemSessaoInvalida = 'Sessão inválida ou expirada.'

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function dadosPublicosUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
  }
}

function prepararPerfil(dadosRecebidos) {
  const dados = dadosRecebidos ?? {}
  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
  const email =
    typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : ''

  if (!nome || !email) {
    return { erro: 'Nome e email são obrigatórios.' }
  }

  if (nome.length > 120) {
    return { erro: 'Nome deve ter no máximo 120 caracteres.' }
  }

  if (email.length > 160 || !emailValido(email)) {
    return { erro: 'Email inválido.' }
  }

  return { dados: { nome, email } }
}

function prepararAlteracaoSenha(dadosRecebidos) {
  const dados = dadosRecebidos ?? {}
  const senhaAtual =
    typeof dados.senhaAtual === 'string' ? dados.senhaAtual : ''
  const novaSenha = typeof dados.novaSenha === 'string' ? dados.novaSenha : ''
  const confirmarNovaSenha =
    typeof dados.confirmarNovaSenha === 'string' ? dados.confirmarNovaSenha : ''

  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    return {
      erro: 'Senha atual, nova senha e confirmação são obrigatórias.',
    }
  }

  if (senhaAtual.length > 200) {
    return { erro: 'Senha atual inválida.' }
  }

  if (novaSenha.length < 8 || novaSenha.length > 200) {
    return { erro: 'A nova senha deve ter entre 8 e 200 caracteres.' }
  }

  if (novaSenha !== confirmarNovaSenha) {
    return { erro: 'A confirmação da nova senha não confere.' }
  }

  if (senhaAtual === novaSenha) {
    return { erro: 'A nova senha deve ser diferente da senha atual.' }
  }

  return { dados: { senhaAtual, novaSenha } }
}

function responderErro(error, response, contexto, mensagem) {
  if (error?.code === 'ER_DUP_ENTRY') {
    return response.status(409).json({
      status: 'erro',
      message: 'Já existe um usuário com este email.',
    })
  }

  console.error(contexto, error)

  return response.status(500).json({
    status: 'erro',
    message: mensagem,
  })
}

export function criarAuthController({
  usuarios = usuarioModel,
  criptografia = bcrypt,
  tokens = jwt,
  variaveis = process.env,
} = {}) {
  async function login(request, response) {
    const email =
      typeof request.body?.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : ''
    const senha =
      typeof request.body?.senha === 'string' ? request.body.senha : ''

    if (!email || !senha) {
      return response.status(400).json({
        status: 'erro',
        message: 'Email e senha são obrigatórios.',
      })
    }

    if (!emailValido(email) || email.length > 160 || senha.length > 200) {
      return response.status(400).json({
        status: 'erro',
        message: 'Dados de acesso inválidos.',
      })
    }

    try {
      const usuario = await usuarios.buscarPorEmail(email)

      if (!usuario || !usuario.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemCredenciaisInvalidas,
        })
      }

      const senhaValida = await criptografia.compare(senha, usuario.senha_hash)

      if (!senhaValida) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemCredenciaisInvalidas,
        })
      }

      if (!variaveis.JWT_SECRET) {
        console.error('JWT_SECRET não configurado.')

        return response.status(500).json({
          status: 'erro',
          message: 'Não foi possível realizar o login.',
        })
      }

      const dadosUsuario = dadosPublicosUsuario(usuario)
      const token = tokens.sign(dadosUsuario, variaveis.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: variaveis.JWT_EXPIRES_IN || '8h',
      })

      return response.status(200).json({
        token,
        usuario: dadosUsuario,
      })
    } catch (error) {
      return responderErro(
        error,
        response,
        'Erro ao autenticar usuário:',
        'Não foi possível realizar o login.',
      )
    }
  }

  async function me(request, response) {
    try {
      const usuario = await usuarios.buscarPorId(request.usuario.id)

      if (!usuario || !usuario.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemSessaoInvalida,
        })
      }

      return response.status(200).json(dadosPublicosUsuario(usuario))
    } catch (error) {
      return responderErro(
        error,
        response,
        'Erro ao buscar usuário autenticado:',
        'Não foi possível validar a sessão.',
      )
    }
  }

  async function atualizarPerfil(request, response) {
    const validacao = prepararPerfil(request.body)

    if (validacao.erro) {
      return response
        .status(400)
        .json({ status: 'erro', message: validacao.erro })
    }

    try {
      const usuarioAtual = await usuarios.buscarPorId(request.usuario.id)

      if (!usuarioAtual || !usuarioAtual.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemSessaoInvalida,
        })
      }

      const usuarioComEmail = await usuarios.buscarPorEmail(
        validacao.dados.email,
      )

      if (usuarioComEmail && usuarioComEmail.id !== request.usuario.id) {
        return response.status(409).json({
          status: 'erro',
          message: 'Já existe um usuário com este email.',
        })
      }

      const usuario = await usuarios.atualizarPerfil(
        request.usuario.id,
        validacao.dados,
      )

      if (!usuario) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemSessaoInvalida,
        })
      }

      return response.status(200).json(dadosPublicosUsuario(usuario))
    } catch (error) {
      return responderErro(
        error,
        response,
        'Erro ao atualizar o próprio perfil:',
        'Não foi possível atualizar o perfil.',
      )
    }
  }

  async function alterarSenha(request, response) {
    const validacao = prepararAlteracaoSenha(request.body)

    if (validacao.erro) {
      return response
        .status(400)
        .json({ status: 'erro', message: validacao.erro })
    }

    try {
      const usuario = await usuarios.buscarPorIdComSenha(request.usuario.id)

      if (!usuario || !usuario.ativo) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemSessaoInvalida,
        })
      }

      const senhaAtualValida = await criptografia.compare(
        validacao.dados.senhaAtual,
        usuario.senha_hash,
      )

      if (!senhaAtualValida) {
        return response.status(400).json({
          status: 'erro',
          message: 'Senha atual incorreta.',
        })
      }

      const senha_hash = await criptografia.hash(validacao.dados.novaSenha, 12)
      const senhaAtualizada = await usuarios.atualizarSenhaPorId(
        request.usuario.id,
        senha_hash,
      )

      if (!senhaAtualizada) {
        return response.status(401).json({
          status: 'erro',
          message: mensagemSessaoInvalida,
        })
      }

      return response.status(200).json({
        message: 'Senha atualizada com sucesso.',
      })
    } catch (error) {
      return responderErro(
        error,
        response,
        'Erro ao alterar a própria senha:',
        'Não foi possível atualizar a senha.',
      )
    }
  }

  return {
    login,
    me,
    atualizarPerfil,
    alterarSenha,
  }
}

export default criarAuthController()
