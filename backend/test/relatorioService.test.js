import assert from 'node:assert/strict'
import test from 'node:test'
import relatorioService, {
  gerarRelatorio,
  normalizarPeriodo,
  PeriodoRelatorioInvalidoError,
} from '../src/services/relatorioService.js'

test('período padrão contempla 30 dias incluindo a data atual', () => {
  assert.deepEqual(
    normalizarPeriodo({}, new Date('2026-07-30T15:00:00.000Z')),
    {
      data_inicio: '2026-07-01',
      data_fim: '2026-07-30',
      total_dias: 30,
    },
  )
})

test('rejeita datas inexistentes e período invertido', () => {
  assert.throws(
    () => normalizarPeriodo({ data_inicio: '2026-02-30' }),
    PeriodoRelatorioInvalidoError,
  )
  assert.throws(
    () =>
      normalizarPeriodo({
        data_inicio: '2026-08-01',
        data_fim: '2026-07-01',
      }),
    /data inicial não pode ser posterior/,
  )
})

test('rejeita período maior que 366 dias', () => {
  assert.throws(
    () =>
      normalizarPeriodo({
        data_inicio: '2025-01-01',
        data_fim: '2026-01-02',
      }),
    /período máximo permitido/,
  )
})

test('gera indicadores, distribuições e detalhes sem duplicar regra de SLA', () => {
  const chamados = [
    {
      id: 1,
      titulo: 'Resolvido no prazo',
      prioridade: 'Crítica',
      categoria: 'Acesso',
      status: 'Resolvido',
      responsavel_nome: 'Ana',
      created_at: '2026-07-01T10:00:00.000Z',
      resolved_at: '2026-07-01T11:00:00.000Z',
    },
    {
      id: 2,
      titulo: 'Fechado fora do prazo',
      prioridade: 'Alta',
      categoria: 'Software',
      status: 'Fechado',
      responsavel_nome: 'Ana',
      created_at: '2026-07-02T08:00:00.000Z',
      resolved_at: '2026-07-02T18:00:00.000Z',
    },
    {
      id: 3,
      titulo: 'Novo chamado',
      prioridade: 'Média',
      categoria: 'Hardware',
      status: 'Novo',
      responsavel_nome: null,
      created_at: '2026-07-03T08:00:00.000Z',
      resolved_at: null,
    },
    {
      id: 4,
      titulo: 'Cancelado',
      prioridade: 'Baixa',
      categoria: 'Outro',
      status: 'Cancelado',
      responsavel_nome: null,
      created_at: '2026-07-04T08:00:00.000Z',
      resolved_at: null,
    },
  ]
  const periodo = {
    data_inicio: '2026-07-01',
    data_fim: '2026-07-30',
    total_dias: 30,
  }

  const relatorio = gerarRelatorio(
    chamados,
    periodo,
    new Date('2026-07-05T08:00:00.000Z'),
  )

  assert.deepEqual(relatorio.resumo, {
    total_chamados: 4,
    chamados_abertos: 1,
    chamados_encerrados: 2,
    chamados_cancelados: 1,
    sla_cumprido_percentual: 50,
    tempo_medio_resolucao_minutos: 330,
  })
  assert.deepEqual(relatorio.distribuicoes.responsavel, [
    { rotulo: 'Ana', total: 2 },
    { rotulo: 'Não atribuído', total: 2 },
  ])
  assert.equal(relatorio.chamados[0].sla_status, 'Dentro do prazo')
  assert.equal(relatorio.chamados[1].sla_status, 'Vencido')
  assert.equal(relatorioService.gerarRelatorio, gerarRelatorio)
})
