import 'dotenv/config'
import path from 'node:path'
import mysql from 'mysql2/promise'
import { criarConfiguracaoBanco } from '../config/database.js'
import {
  carregarMigrations,
  executarMigrations,
} from '../services/migrationService.js'

const diretorioMigrations = path.resolve(process.cwd(), 'sql')
let connection

try {
  const migrations = await carregarMigrations(diretorioMigrations)
  connection = await mysql.createConnection(
    criarConfiguracaoBanco(process.env, { multipleStatements: true }),
  )

  const aplicadas = await executarMigrations(
    connection,
    migrations,
    (migration) => console.log(`Aplicando migration: ${migration}`),
  )

  if (aplicadas.length === 0) {
    console.log('Banco de dados já está atualizado.')
  } else {
    console.log(`${aplicadas.length} migration(s) aplicada(s) com sucesso.`)
  }
} catch (error) {
  console.error(
    'Falha ao atualizar o banco de dados:',
    error?.code || error?.name || 'erro_desconhecido',
  )
  process.exitCode = 1
} finally {
  await connection?.end()
}
