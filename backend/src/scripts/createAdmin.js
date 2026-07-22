import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from '../database/db.js'
import usuarioModel from '../models/usuarioModel.js'

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function criarAdministrador() {
  const nome = process.env.ADMIN_NOME?.trim() || ''
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || ''
  const senha = process.env.ADMIN_SENHA || ''
  const cargo = process.env.ADMIN_CARGO?.trim() || 'Administrador'

  if (!nome || nome.length > 120) {
    throw new Error('ADMIN_NOME é obrigatório e deve ter até 120 caracteres.')
  }

  if (!validarEmail(email) || email.length > 160) {
    throw new Error('ADMIN_EMAIL deve conter um email válido.')
  }

  if (senha.length < 8) {
    throw new Error('ADMIN_SENHA deve ter pelo menos 8 caracteres.')
  }

  if (cargo.length > 50) {
    throw new Error('ADMIN_CARGO deve ter até 50 caracteres.')
  }

  const usuarioExistente = await usuarioModel.buscarPorEmail(email)

  if (usuarioExistente) {
    throw new Error('Já existe um usuário cadastrado com este email.')
  }

  const senha_hash = await bcrypt.hash(senha, 12)

  const usuario = await usuarioModel.criar({
    nome,
    email,
    senha_hash,
    cargo,
  })

  console.log(`Administrador criado com sucesso: ${usuario.email}`)
}

try {
  await criarAdministrador()
} catch (error) {
  console.error(`Não foi possível criar o administrador: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
