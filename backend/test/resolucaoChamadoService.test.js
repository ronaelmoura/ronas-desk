import assert from 'node:assert/strict'
import test from 'node:test'
import resolucaoChamadoService from '../src/services/resolucaoChamadoService.js'

const primeiraResolucao = new Date('2026-01-01T10:00:00.000Z')
const segundaResolucao = new Date('2026-01-02T11:00:00.000Z')

test('transição para Resolvido registra resolved_at', () => {
  assert.equal(
    resolucaoChamadoService.determinarResolvedAt(
      'Em Atendimento',
      'Resolvido',
      null,
      primeiraResolucao,
    ),
    primeiraResolucao,
  )
})

test('transição para Fechado registra resolved_at', () => {
  assert.equal(
    resolucaoChamadoService.determinarResolvedAt(
      'Novo',
      'Fechado',
      null,
      primeiraResolucao,
    ),
    primeiraResolucao,
  )
})

test('edição posterior de encerrado preserva resolved_at', () => {
  assert.equal(
    resolucaoChamadoService.determinarResolvedAt(
      'Resolvido',
      'Resolvido',
      primeiraResolucao,
      segundaResolucao,
    ),
    primeiraResolucao,
  )
})

test('mudança entre Resolvido e Fechado preserva resolved_at', () => {
  assert.equal(
    resolucaoChamadoService.determinarResolvedAt(
      'Resolvido',
      'Fechado',
      primeiraResolucao,
      segundaResolucao,
    ),
    primeiraResolucao,
  )
})

test('reabertura limpa resolved_at', () => {
  assert.equal(
    resolucaoChamadoService.determinarResolvedAt(
      'Fechado',
      'Em Atendimento',
      primeiraResolucao,
      segundaResolucao,
    ),
    null,
  )
})

test('nova resolução após reabertura registra nova data', () => {
  const reaberto = resolucaoChamadoService.determinarResolvedAt(
    'Resolvido',
    'Novo',
    primeiraResolucao,
    segundaResolucao,
  )
  const resolvidoNovamente = resolucaoChamadoService.determinarResolvedAt(
    'Novo',
    'Resolvido',
    reaberto,
    segundaResolucao,
  )

  assert.equal(resolvidoNovamente, segundaResolucao)
})
