import assert from 'node:assert/strict'
import test from 'node:test'
import relatorioModel from '../src/models/relatorioModel.js'

test('consulta chamados pelo período com parâmetros e limite final inclusivo', async () => {
  const chamadas = []
  const registros = [{ id: 1, titulo: 'Erro no acesso' }]
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [registros, []]
    },
  }

  const resultado = await relatorioModel.listarChamadosPorPeriodo(
    '2026-07-01',
    '2026-07-31',
    executor,
  )

  assert.equal(resultado, registros)
  assert.equal(chamadas.length, 1)
  assert.match(chamadas[0].sql, /chamados\.created_at >= \?/)
  assert.match(chamadas[0].sql, /DATE_ADD\(\?, INTERVAL 1 DAY\)/)
  assert.deepEqual(chamadas[0].parametros, ['2026-07-01', '2026-07-31'])
})

test('gerarRelatorioPaginado monta resumo, distribuições, chamados e total', async () => {
  const chamadas = []
  const respostas = [
    [
      [
        {
          total_chamados: '3',
          chamados_abertos: '1',
          chamados_encerrados: '2',
          chamados_cancelados: '0',
          tempo_medio_resolucao_minutos: '123.456',
          sla_cumprido_percentual: '80.005',
        },
      ],
    ],
    [
      [
        { rotulo: 'Resolvido', total: 2 },
        { rotulo: 'Novo', total: 1 },
      ],
    ],
    [[{ rotulo: 'Alta', total: 2 }]],
    [[{ rotulo: 'Bug', total: 3 }]],
    [[{ rotulo: 'Não atribuído', total: 1 }]],
    [[{ id: 1, titulo: 'Erro no acesso' }]],
    [[{ total: 3 }]],
  ]
  const executor = {
    async execute(sql, parametros) {
      const indice = chamadas.length
      chamadas.push({ sql, parametros })
      return respostas[indice]
    },
  }

  const periodo = { data_inicio: '2026-07-01', data_fim: '2026-07-31' }
  const paginacao = { limite: 10, offset: 0 }

  const resultado = await relatorioModel.gerarRelatorioPaginado(
    periodo,
    paginacao,
    executor,
  )

  assert.equal(chamadas.length, 7)
  assert.deepEqual(resultado.resumo, {
    total_chamados: 3,
    chamados_abertos: 1,
    chamados_encerrados: 2,
    chamados_cancelados: 0,
    sla_cumprido_percentual: 80,
    tempo_medio_resolucao_minutos: 123.46,
  })
  assert.deepEqual(resultado.distribuicoes.status, [
    { rotulo: 'Resolvido', total: 2 },
    { rotulo: 'Novo', total: 1 },
  ])
  assert.deepEqual(resultado.distribuicoes.prioridade, [
    { rotulo: 'Alta', total: 2 },
  ])
  assert.deepEqual(resultado.distribuicoes.categoria, [
    { rotulo: 'Bug', total: 3 },
  ])
  assert.deepEqual(resultado.distribuicoes.responsavel, [
    { rotulo: 'Não atribuído', total: 1 },
  ])
  assert.deepEqual(resultado.chamados, [{ id: 1, titulo: 'Erro no acesso' }])
  assert.equal(resultado.total, 3)
  assert.match(chamadas[6].sql, /SELECT COUNT\(\*\) AS total FROM chamados/)
})

test('gerarRelatorioPaginado retorna nulos quando não há chamados resolvidos', async () => {
  const respostas = [
    [
      [
        {
          total_chamados: '0',
          chamados_abertos: '0',
          chamados_encerrados: '0',
          chamados_cancelados: '0',
          tempo_medio_resolucao_minutos: null,
          sla_cumprido_percentual: null,
        },
      ],
    ],
    [[]],
    [[]],
    [[]],
    [[]],
    [[]],
    [[{ total: 0 }]],
  ]
  let indice = 0
  const executor = {
    async execute() {
      return respostas[indice++]
    },
  }

  const resultado = await relatorioModel.gerarRelatorioPaginado(
    { data_inicio: '2026-07-01', data_fim: '2026-07-31' },
    { limite: 10, offset: 0 },
    executor,
  )

  assert.equal(resultado.resumo.sla_cumprido_percentual, null)
  assert.equal(resultado.resumo.tempo_medio_resolucao_minutos, null)
  assert.equal(resultado.total, 0)
})
