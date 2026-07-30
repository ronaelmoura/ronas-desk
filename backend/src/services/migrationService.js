import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const TABELAS_DA_APLICACAO = [
  'clientes',
  'chamados',
  'usuarios',
  'auditoria',
  'comentarios',
  'ticket_history',
  'anexos',
]

export class BancoExistenteSemHistoricoError extends Error {
  constructor() {
    super(
      'O banco já contém tabelas da aplicação, mas não possui histórico de migrations.',
    )
    this.name = 'BancoExistenteSemHistoricoError'
  }
}

export class MigrationNaoAplicadaError extends Error {
  constructor(migration, causa) {
    super(`Não foi possível aplicar a migration ${migration}.`)
    this.name = 'MigrationNaoAplicadaError'
    this.migration = migration
    this.code = causa?.code
    this.cause = causa
  }
}

export async function carregarMigrations(diretorio) {
  const arquivos = (await readdir(diretorio))
    .filter((arquivo) => arquivo.endsWith('.sql'))
    .sort((primeiro, segundo) => primeiro.localeCompare(segundo))

  return Promise.all(
    arquivos.map(async (arquivo) => ({
      nome: arquivo,
      sql: await readFile(path.join(diretorio, arquivo), 'utf8'),
    })),
  )
}

async function criarHistorico(executor) {
  await executor.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nome VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function buscarMigrationsAplicadas(executor) {
  const [rows] = await executor.execute(`
    SELECT nome
    FROM schema_migrations
    ORDER BY nome ASC
  `)

  return new Set(rows.map((row) => row.nome))
}

async function protegerBancoExistente(executor, migrationsAplicadas) {
  if (migrationsAplicadas.size > 0) {
    return
  }

  const placeholders = TABELAS_DA_APLICACAO.map(() => '?').join(', ')
  const [rows] = await executor.execute(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (${placeholders})
    `,
    TABELAS_DA_APLICACAO,
  )

  if (Number(rows[0]?.total ?? 0) > 0) {
    throw new BancoExistenteSemHistoricoError()
  }
}

export async function executarMigrations(
  executor,
  migrations,
  aoAplicar = () => {},
) {
  await criarHistorico(executor)

  const migrationsAplicadas = await buscarMigrationsAplicadas(executor)
  await protegerBancoExistente(executor, migrationsAplicadas)

  const aplicadasAgora = []

  for (const migration of migrations) {
    if (migrationsAplicadas.has(migration.nome)) {
      continue
    }

    aoAplicar(migration.nome)

    try {
      await executor.query(migration.sql)
      await executor.execute(
        'INSERT INTO schema_migrations (nome) VALUES (?)',
        [migration.nome],
      )
      aplicadasAgora.push(migration.nome)
    } catch (error) {
      throw new MigrationNaoAplicadaError(migration.nome, error)
    }
  }

  return aplicadasAgora
}
