import assert from 'node:assert/strict'
import test from 'node:test'
import comentarioModel from '../src/models/comentarioModel.js'

function criarExecutor(respostas = []) {
  const chamadas = []

  return {
    chamadas,
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return respostas.shift() ?? [[], []]
    },
  }
}

test('lista comentários do chamado em ordem cronológica', async () => {
  const comentarios = [
    { id: 1, conteudo: 'Primeiro comentário' },
    { id: 2, conteudo: 'Segundo comentário' },
  ]
  const executor = criarExecutor([[comentarios, []]])

  const resultado = await comentarioModel.listarPorChamado(21, executor)

  assert.equal(resultado, comentarios)
  assert.equal(executor.chamadas.length, 1)
  assert.match(executor.chamadas[0].sql, /WHERE comentarios\.chamado_id = \?/)
  assert.match(
    executor.chamadas[0].sql,
    /ORDER BY comentarios\.created_at ASC, comentarios\.id ASC/,
  )
  assert.deepEqual(executor.chamadas[0].parametros, [21])
})

test('cria comentário e retorna o registro completo usando o mesmo executor', async () => {
  const comentarioCriado = {
    id: 99,
    chamado_id: 12,
    usuario_id: 4,
    conteudo: 'Cliente respondeu.',
    tipo: 'PUBLICO',
  }
  const executor = criarExecutor([
    [{ insertId: 99 }, []],
    [[comentarioCriado], []],
  ])

  const resultado = await comentarioModel.criar(
    {
      chamado_id: 12,
      usuario_id: 4,
      conteudo: 'Cliente respondeu.',
      tipo: 'PUBLICO',
    },
    executor,
  )

  assert.equal(resultado, comentarioCriado)
  assert.equal(executor.chamadas.length, 2)
  assert.match(executor.chamadas[0].sql, /INSERT INTO comentarios/)
  assert.deepEqual(executor.chamadas[0].parametros, [
    12,
    4,
    'Cliente respondeu.',
    'PUBLICO',
  ])
  assert.match(executor.chamadas[1].sql, /WHERE comentarios\.id = \?/)
  assert.deepEqual(executor.chamadas[1].parametros, [99])
})

test('preserva comentário interno ao enviar os parâmetros para o banco', async () => {
  const executor = criarExecutor([
    [{ insertId: 5 }, []],
    [[{ id: 5, tipo: 'INTERNO' }], []],
  ])

  await comentarioModel.criar(
    {
      chamado_id: 8,
      usuario_id: 2,
      conteudo: 'Análise exclusiva da equipe.',
      tipo: 'INTERNO',
    },
    executor,
  )

  assert.deepEqual(executor.chamadas[0].parametros, [
    8,
    2,
    'Análise exclusiva da equipe.',
    'INTERNO',
  ])
})

test('lista apenas comentários públicos no Portal do Cliente', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[{ id: 2, tipo: 'PUBLICO' }], []]
    },
  }

  const comentarios = await comentarioModel.listarPublicosPorChamado(
    7,
    executor,
  )

  assert.equal(comentarios[0].tipo, 'PUBLICO')
  assert.match(chamadas[0].sql, /comentarios\.tipo = 'PUBLICO'/)
  assert.deepEqual(chamadas[0].parametros, [7])
})
