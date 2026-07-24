import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import usuarioModel from '../models/usuarioModel.js'

const mensagemCredenciaisInvalidas = 'Email ou senha inválidos.'

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
    const usuario = await usuarioModel.buscarPorEmail(email)

    if (!usuario || !usuario.ativo) {
      return response.status(401).json({
        status: 'erro',
        message: mensagemCredenciaisInvalidas,
      })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)

    if (!senhaValida) {
      return response.status(401).json({
        status: 'erro',
        message: mensagemCredenciaisInvalidas,
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado.')

      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível realizar o login.',
      })
    }

    const dadosUsuario = dadosPublicosUsuario(usuario)
    const token = jwt.sign(dadosUsuario, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })

    return response.status(200).json({
      token,
      usuario: dadosUsuario,
    })
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível realizar o login.',
    })
  }
}

async function me(request, response) {
  try {
    const usuario = await usuarioModel.buscarPorId(request.usuario.id)

    if (!usuario || !usuario.ativo) {
      return response.status(401).json({
        status: 'erro',
        message: 'Sessão inválida ou expirada.',
      })
    }

    return response.status(200).json(dadosPublicosUsuario(usuario))
  } catch (error) {
    console.error('Erro ao buscar usuário autenticado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível validar a sessão.',
    })
  }
}

export default {
  login,
  me,
}
