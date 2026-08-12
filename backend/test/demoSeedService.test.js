import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ATENDENTES_DEMO,
  CLIENTES_DEMO,
  CHAMADOS_DEMO,
  popularDadosDemonstracao,
} from '../src/services/demoSeedService.js'

test('cenário demo representa uma operação variada de suporte', () => {
  assert.ok(ATENDENTES_DEMO.length >= 4)
  assert.ok(CLIENTES_DEMO.length >= 6)
  assert.ok(CHAMADOS_DEMO.length >= 12)
  assert.deepEqual(
    new Set(CHAMADOS_DEMO.map((item) => item[4])),
    new Set([
      'Novo',
      'Em Atendimento',
      'Aguardando Cliente',
      'Resolvido',
      'Fechado',
      'Cancelado',
    ]),
  )
  assert.deepEqual(
    new Set(CHAMADOS_DEMO.map((item) => item[3])),
    new Set(['Crítica', 'Alta', 'Média', 'Baixa']),
  )
  assert.ok(new Set(CHAMADOS_DEMO.map((item) => item[2])).size >= 5)
  assert.equal(
    new Set(CHAMADOS_DEMO.map((item) => item[6])).size,
    ATENDENTES_DEMO.length,
  )
})

test('serviço exige dependências explícitas antes de acessar o banco', async () => {
  await assert.rejects(
    popularDadosDemonstracao({}),
    /Executor e hash de senha são obrigatórios/,
  )
})
