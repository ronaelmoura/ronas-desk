import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import pool from '../database/db.js'
import { popularDadosDemonstracao } from '../services/demoSeedService.js'

let connection
try {
  connection = await pool.getConnection()
  await connection.beginTransaction()
  const senhaHash = await bcrypt.hash(randomBytes(32).toString('base64url'), 12)
  const resultado = await popularDadosDemonstracao({
    executor: connection,
    senhaHash,
  })
  await connection.commit()
  console.log(
    `Cenário demonstrativo preparado: ${resultado.atendentes} atendentes, ` +
      `${resultado.clientes} clientes e ${resultado.chamados} chamados.`,
  )
} catch (error) {
  if (connection) await connection.rollback()
  console.error(
    `Não foi possível preparar os dados demonstrativos: ${error.message}`,
  )
  process.exitCode = 1
} finally {
  connection?.release()
  await pool.end()
}
