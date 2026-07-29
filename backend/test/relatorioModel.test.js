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
