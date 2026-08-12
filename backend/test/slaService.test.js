import assert from 'node:assert/strict'
import test from 'node:test'
import slaService, {
  PrioridadeSlaInvalidaError,
} from '../src/services/slaService.js'

const inicio = '2026-01-01T00:00:00.000Z'

function chamado(overrides = {}) {
  return {
    prioridade: 'Alta',
    status: 'Novo',
    created_at: inicio,
    updated_at: null,
    resolved_at: null,
    first_response_at: null,
    ...overrides,
  }
}

function calcularEm(horas, overrides) {
  return slaService.calcular(
    chamado(overrides),
    new Date(Date.parse(inicio) + horas * 60 * 60 * 1000),
  )
}

test('calcula chamado dentro do prazo e exatamente abaixo de 80%', () => {
  assert.equal(calcularEm(1).status, 'Dentro do prazo')
  assert.equal(calcularEm(6.399).status, 'Dentro do prazo')
})

test('classifica exatamente 80% e entre 80% e 100%', () => {
  assert.equal(calcularEm(6.4).status, 'Próximo do vencimento')
  assert.equal(calcularEm(7).status, 'Próximo do vencimento')
})

test('classifica exatamente 100% e SLA vencido', () => {
  assert.equal(calcularEm(8).status, 'Vencido')
  assert.equal(calcularEm(9).isOverdue, true)
})

test('usa limites das quatro prioridades', () => {
  assert.equal(calcularEm(0, { prioridade: 'Crítica' }).limitMinutes, 120)
  assert.equal(calcularEm(0, { prioridade: 'Alta' }).limitMinutes, 480)
  assert.equal(calcularEm(0, { prioridade: 'Média' }).limitMinutes, 1440)
  assert.equal(calcularEm(0, { prioridade: 'Baixa' }).limitMinutes, 4320)
})

test('chamado resolvido congela exclusivamente em resolved_at', () => {
  const sla = calcularEm(20, {
    status: 'Resolvido',
    updated_at: '2026-01-01T15:00:00.000Z',
    resolved_at: '2026-01-01T03:00:00.000Z',
  })

  assert.equal(sla.elapsedMinutes, 180)
  assert.equal(sla.isResolved, true)
})

test('chamado aberto sem data de resolução usa o relógio informado', () => {
  assert.equal(calcularEm(2).elapsedMinutes, 120)
})

test('reabertura calcula o SLA a partir do novo ciclo', () => {
  const sla = calcularEm(30, {
    status: 'Em Atendimento',
    sla_started_at: '2026-01-02T00:00:00.000Z',
  })

  assert.equal(sla.elapsedMinutes, 360)
  assert.equal(sla.dueAt, '2026-01-02T08:00:00.000Z')
})

test('chamado resolvido sem data real não inventa duração', () => {
  assert.equal(calcularEm(20, { status: 'Resolvido' }), null)
})

test('rejeita prioridade desconhecida explicitamente', () => {
  assert.throws(
    () => calcularEm(1, { prioridade: 'Urgente' }),
    PrioridadeSlaInvalidaError,
  )
})

test('limita apenas o percentual visual a 100%', () => {
  const sla = calcularEm(16)
  assert.equal(sla.percentage, 200)
  assert.equal(sla.displayPercentage, 100)
})

test('retorna null para data de criação inválida', () => {
  assert.equal(
    slaService.calcular(chamado({ created_at: null }), new Date()),
    null,
  )
})

test('dashboard não inventa médias sem dados reais', () => {
  const indicadores = slaService.calcularIndicadoresDashboard(
    [chamado()],
    new Date(inicio),
  )
  assert.equal(indicadores.tempo_medio_resolucao_minutos, null)
  assert.equal(indicadores.tempo_medio_primeira_resposta_minutos, null)
})

test('dashboard calcula a média somente com chamados que receberam resposta', () => {
  const indicadores = slaService.calcularIndicadoresDashboard(
    [
      chamado({ first_response_at: '2026-01-01T00:30:00.000Z' }),
      chamado({ first_response_at: '2026-01-01T01:30:00.000Z' }),
      chamado(),
    ],
    new Date(inicio),
  )

  assert.equal(indicadores.tempo_medio_primeira_resposta_minutos, 60)
})

test('dashboard ignora primeira resposta anterior à criação do chamado', () => {
  const indicadores = slaService.calcularIndicadoresDashboard(
    [
      chamado({ first_response_at: '2025-12-31T23:59:00.000Z' }),
      chamado({ first_response_at: '2026-01-01T00:20:00.000Z' }),
    ],
    new Date(inicio),
  )

  assert.equal(indicadores.tempo_medio_primeira_resposta_minutos, 20)
})

test('média ignora chamado encerrado legado sem resolved_at', () => {
  const indicadores = slaService.calcularIndicadoresDashboard(
    [
      chamado({ status: 'Resolvido' }),
      chamado({
        status: 'Fechado',
        resolved_at: '2026-01-01T04:00:00.000Z',
      }),
    ],
    new Date('2026-01-03T00:00:00.000Z'),
  )

  assert.equal(indicadores.tempo_medio_resolucao_minutos, 240)
})
