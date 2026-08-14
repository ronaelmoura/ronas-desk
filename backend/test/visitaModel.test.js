import assert from 'node:assert/strict'
import test from 'node:test'
import visitaModel from '../src/models/visitaModel.js'

function criarExecutor() {
  const consultas = []
  const respostas = [
    [[{ total_visitas: 3, visitantes_unicos: 2 }]],
    [[{ data: '2026-08-14', total: 3 }]],
    [[]],
    [[]],
    [[]],
    [[]],
  ]

  return {
    consultas,
    async execute(sql, parametros) {
      consultas.push({ sql, parametros })
      return respostas.shift()
    },
  }
}

test('padroniza o dia das visitas como texto AAAA-MM-DD', async () => {
  const executor = criarExecutor()

  const resumo = await visitaModel.buscarResumo(
    '2026-08-01',
    '2026-08-31',
    executor,
  )

  assert.match(
    executor.consultas[1].sql,
    /DATE_FORMAT\(created_at, '%Y-%m-%d'\)/,
  )
  assert.match(
    executor.consultas[1].sql,
    /GROUP BY DATE_FORMAT\(created_at, '%Y-%m-%d'\)/,
  )
  assert.deepEqual(resumo.por_dia, [{ data: '2026-08-14', total: 3 }])
})
