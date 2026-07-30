import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from '../database/db.js'
import usuarioModel from '../models/usuarioModel.js'

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function redefinirSenha() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || ''
  const senha = process.env.ADMIN_SENHA || ''

  if (!validarEmail(email) || email.length > 160) {
    throw new Error('ADMIN_EMAIL deve conter um email válido.')
  }

  if (senha.length < 8 || senha.length > 200) {
    throw new Error('ADMIN_SENHA deve ter entre 8 e 200 caracteres.')
  }

  const senhaHash = await bcrypt.hash(senha, 12)
  const senhaAtualizada = await usuarioModel.atualizarSenhaPorEmail(
    email,
    senhaHash,
  )

  if (!senhaAtualizada) {
    throw new Error('Usuário ativo não encontrado.')
  }

  console.log('Senha do administrador redefinida com sucesso.')
}

try {
  await redefinirSenha()
} catch (error) {
  console.error(`Não foi possível redefinir a senha: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
