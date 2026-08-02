import assert from 'node:assert/strict'
import test from 'node:test'
import primeiraRespostaService from '../src/services/primeiraRespostaService.js'

function criarExecutor() {
  const chamadas = []

  return {
    chamadas,
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }
}

test('registra a primeira resposta para comentário público', async () => {
  const executor = criarExecutor()
  const criadoEm = new Date('2026-08-01T12:30:00.000Z')

  const registrado = await primeiraRespostaService.registrarSeAplicavel(
    17,
    { tipo: 'PUBLICO', created_at: criadoEm },
    executor,
  )

  assert.equal(registrado, true)
  assert.equal(executor.chamadas.length, 1)
  assert.match(executor.chamadas[0].sql, /UPDATE chamados/)
  assert.match(
    executor.chamadas[0].sql,
    /first_response_at IS NULL OR first_response_at > \?/,
  )
  assert.deepEqual(executor.chamadas[0].parametros, [criadoEm, criadoEm, 17])
})

test('não registra resposta para comentário interno', async () => {
  const executor = criarExecutor()

  const registrado = await primeiraRespostaService.registrarSeAplicavel(
    17,
    { tipo: 'INTERNO', created_at: new Date() },
    executor,
  )

  assert.equal(registrado, false)
  assert.equal(executor.chamadas.length, 0)
})

test('rejeita comentário público sem data de criação', async () => {
  const executor = criarExecutor()

  await assert.rejects(
    primeiraRespostaService.registrarSeAplicavel(
      17,
      { tipo: 'PUBLICO', created_at: null },
      executor,
    ),
    /Comentário público sem data de criação/,
  )

  assert.equal(executor.chamadas.length, 0)
})
