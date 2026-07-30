import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BancoExistenteSemHistoricoError,
  executarMigrations,
  MigrationNaoAplicadaError,
} from '../src/services/migrationService.js'

function criarExecutor({ aplicadas = [], tabelasExistentes = 0 } = {}) {
  const chamadas = []

  return {
    chamadas,
    async execute(sql, parametros) {
      chamadas.push({ metodo: 'execute', sql, parametros })

      if (sql.includes('SELECT nome')) {
        return [aplicadas.map((nome) => ({ nome })), []]
      }

      if (sql.includes('information_schema.TABLES')) {
        return [[{ total: tabelasExistentes }], []]
      }

      return [{ affectedRows: 1 }, []]
    },
    async query(sql) {
      chamadas.push({ metodo: 'query', sql })
      return [[], []]
    },
  }
}

test('aplica somente migrations ainda não registradas', async () => {
  const executor = criarExecutor({ aplicadas: ['000_base.sql'] })
  const migrations = [
    { nome: '000_base.sql', sql: 'CREATE TABLE base (id INT)' },
    { nome: '001_usuarios.sql', sql: 'CREATE TABLE usuarios (id INT)' },
  ]
  const notificadas = []

  const resultado = await executarMigrations(executor, migrations, (nome) =>
    notificadas.push(nome),
  )

  assert.deepEqual(resultado, ['001_usuarios.sql'])
  assert.deepEqual(notificadas, ['001_usuarios.sql'])
  assert.equal(
    executor.chamadas.filter((chamada) => chamada.metodo === 'query').length,
    1,
  )
  assert.deepEqual(executor.chamadas.at(-1).parametros, ['001_usuarios.sql'])
})

test('interrompe banco existente que não possui histórico', async () => {
  const executor = criarExecutor({ tabelasExistentes: 2 })

  await assert.rejects(
    executarMigrations(executor, [
      { nome: '000_base.sql', sql: 'CREATE TABLE base (id INT)' },
    ]),
    BancoExistenteSemHistoricoError,
  )

  assert.equal(
    executor.chamadas.some((chamada) => chamada.metodo === 'query'),
    false,
  )
})

test('não registra migration que falhou', async () => {
  const executor = criarExecutor()
  executor.query = async () => {
    const error = new Error('falha')
    error.code = 'ER_TESTE'
    throw error
  }

  await assert.rejects(
    executarMigrations(executor, [
      { nome: '001_falha.sql', sql: 'SQL INVÁLIDO' },
    ]),
    (error) =>
      error instanceof MigrationNaoAplicadaError &&
      error.migration === '001_falha.sql' &&
      error.code === 'ER_TESTE',
  )

  assert.equal(
    executor.chamadas.some((chamada) =>
      chamada.sql.includes('INSERT INTO schema_migrations'),
    ),
    false,
  )
})
