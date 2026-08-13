import assert from 'node:assert/strict'
import test from 'node:test'
import {
  criarClausulaPaginacao,
  criarRespostaPaginada,
  normalizarPaginacao,
  PaginacaoInvalidaError,
} from '../src/services/paginacaoService.js'

test('normaliza paginação e limita a consulta por página', () => {
  const paginacao = normalizarPaginacao({ pagina: '3', limite: '20' })

  assert.deepEqual(paginacao, { pagina: 3, limite: 20, offset: 40 })
  assert.deepEqual(criarRespostaPaginada([{ id: 1 }], 41, paginacao), {
    dados: [{ id: 1 }],
    paginacao: { pagina: 3, limite: 20, total: 41, total_paginas: 3 },
  })
})

test('rejeita limites fora da faixa segura', () => {
  assert.throws(
    () => normalizarPaginacao({ pagina: '0' }),
    PaginacaoInvalidaError,
  )
  assert.throws(
    () => normalizarPaginacao({ limite: '101' }),
    PaginacaoInvalidaError,
  )
})

test('cria uma clausula de paginação somente com inteiros validados', () => {
  assert.equal(
    criarClausulaPaginacao({ limite: 20, offset: 40 }),
    'LIMIT 20 OFFSET 40',
  )
  assert.throws(
    () => criarClausulaPaginacao({ limite: '20', offset: 0 }),
    PaginacaoInvalidaError,
  )
})
