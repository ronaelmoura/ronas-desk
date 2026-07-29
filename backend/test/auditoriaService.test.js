import assert from 'node:assert/strict'
import test from 'node:test'
import auditoriaService from '../src/services/auditoriaService.js'

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

test('registra auditoria com SQL parametrizado e valores opcionais nulos', async () => {
  const executor = criarExecutor()

  await auditoriaService.registrar(
    {
      entidade: 'chamado',
      entidade_id: 42,
      usuario_id: 7,
      acao: 'criacao',
      descricao: 'Chamado criado.',
    },
    executor,
  )

  assert.equal(executor.chamadas.length, 1)
  assert.match(executor.chamadas[0].sql, /INSERT INTO auditoria/)
  assert.match(
    executor.chamadas[0].sql,
    /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)/,
  )
  assert.deepEqual(executor.chamadas[0].parametros, [
    'chamado',
    42,
    7,
    'criacao',
    null,
    null,
    null,
    'Chamado criado.',
  ])
})

test('registra os valores anterior e novo de uma alteração', async () => {
  const executor = criarExecutor()

  await auditoriaService.registrar(
    {
      entidade: 'chamado',
      entidade_id: 10,
      usuario_id: 3,
      acao: 'alteracao_status',
      campo: 'status',
      valor_anterior: 'Novo',
      valor_novo: 'Em Atendimento',
      descricao: 'Status alterado.',
    },
    executor,
  )

  assert.deepEqual(executor.chamadas[0].parametros, [
    'chamado',
    10,
    3,
    'alteracao_status',
    'status',
    'Novo',
    'Em Atendimento',
    'Status alterado.',
  ])
})

test('lista a timeline do chamado em ordem cronológica', async () => {
  const timeline = [
    { id: 1, acao: 'criacao' },
    { id: 2, acao: 'alteracao_status' },
  ]
  const executor = criarExecutor([[timeline, []]])

  const resultado = await auditoriaService.listarPorChamado(15, executor)

  assert.equal(resultado, timeline)
  assert.equal(executor.chamadas.length, 1)
  assert.match(
    executor.chamadas[0].sql,
    /WHERE auditoria\.entidade = 'chamado'/,
  )
  assert.match(
    executor.chamadas[0].sql,
    /ORDER BY auditoria\.created_at ASC, auditoria\.id ASC/,
  )
  assert.deepEqual(executor.chamadas[0].parametros, [15])
})
