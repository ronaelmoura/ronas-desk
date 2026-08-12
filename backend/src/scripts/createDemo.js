import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import pool from '../database/db.js'
import usuarioModel from '../models/usuarioModel.js'

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function criarDemo() {
  const nome = process.env.DEMO_NOME?.trim() || 'Visitante Demo'
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase() || ''

  if (!nome || nome.length > 120) {
    throw new Error('DEMO_NOME deve ter até 120 caracteres.')
  }

  if (!validarEmail(email) || email.length > 160) {
    throw new Error('DEMO_EMAIL deve conter um email válido.')
  }

  const demoExistente = await usuarioModel.buscarDemoAtivo()

  if (demoExistente) {
    throw new Error('Já existe uma conta de demonstração ativa.')
  }

  const usuarioComEmail = await usuarioModel.buscarPorEmail(email)

  if (usuarioComEmail) {
    throw new Error('Já existe um usuário cadastrado com este email.')
  }

  const senhaAleatoria = randomBytes(32).toString('base64url')
  const senha_hash = await bcrypt.hash(senhaAleatoria, 12)

  const usuario = await usuarioModel.criar({
    nome,
    email,
    senha_hash,
    cargo: 'Atendente',
    is_demo: true,
  })

  console.log(`Conta de demonstração criada com sucesso: ${usuario.email}`)
}

try {
  await criarDemo()
} catch (error) {
  console.error(`Não foi possível criar a conta Demo: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
