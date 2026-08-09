import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filtrarChamadosPorPeriodo,
  obterPeriodo,
} from '../src/controllers/dashboardController.js'
import {
  buscarResumo,
  criarFiltroPeriodo,
} from '../src/models/dashboardModel.js'
import { PeriodoRelatorioInvalidoError } from '../src/services/relatorioService.js'

test('dashboard exige as duas datas quando recebe filtro de período', () => {
  assert.equal(obterPeriodo({}), null)
  assert.throws(
    () => obterPeriodo({ data_inicio: '2026-08-01' }),
    PeriodoRelatorioInvalidoError,
  )
  assert.deepEqual(
    obterPeriodo({
      data_inicio: '2026-08-01',
      data_fim: '2026-08-09',
    }),
    {
      data_inicio: '2026-08-01',
      data_fim: '2026-08-09',
      total_dias: 9,
    },
  )
})

test('dashboard inclui integralmente as datas inicial e final', () => {
  const chamados = [
    { id: 1, created_at: '2026-07-31T23:59:59.999Z' },
    { id: 2, created_at: '2026-08-01T00:00:00.000Z' },
    { id: 3, created_at: '2026-08-09T23:59:59.999Z' },
    { id: 4, created_at: '2026-08-10T00:00:00.000Z' },
    { id: 5, created_at: 'data-invalida' },
  ]

  assert.deepEqual(
    filtrarChamadosPorPeriodo(chamados, {
      data_inicio: '2026-08-01',
      data_fim: '2026-08-09',
    }).map((chamado) => chamado.id),
    [2, 3],
  )
})

test('filtro do dashboard mantém SQL parametrizado e fim inclusivo', () => {
  assert.deepEqual(criarFiltroPeriodo(), {
    clausula: '',
    parametros: [],
  })

  const filtro = criarFiltroPeriodo('2026-08-01', '2026-08-09')
  assert.match(filtro.clausula, /created_at >= \?/)
  assert.match(filtro.clausula, /DATE_ADD\(\?, INTERVAL 1 DAY\)/)
  assert.deepEqual(filtro.parametros, ['2026-08-01', '2026-08-09'])
})

test('resumo aplica o mesmo período nas duas consultas', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })

      if (chamadas.length === 1) {
        return [
          [
            {
              total_clientes: 2,
              total_usuarios: 3,
              total_chamados: null,
              chamados_novos: null,
              chamados_em_atendimento: null,
              chamados_aguardando_cliente: null,
              chamados_resolvidos: null,
              chamados_fechados: null,
              chamados_cancelados: null,
              chamados_criticos: null,
            },
          ],
        ]
      }

      return [[]]
    },
  }

  const resumo = await buscarResumo('2026-08-01', '2026-08-09', executor)

  assert.equal(chamadas.length, 2)
  for (const chamada of chamadas) {
    assert.deepEqual(chamada.parametros, ['2026-08-01', '2026-08-09'])
    assert.match(chamada.sql, /created_at >= \?/)
  }
  assert.equal(resumo.total_chamados, 0)
  assert.deepEqual(resumo.chamados_recentes, [])
})
