import assert from 'node:assert/strict'
import test from 'node:test'

import avaliacaoModel from '../src/models/avaliacaoModel.js'

test('avaliação busca somente o chamado do cliente informado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[], []]
    },
  }

  const avaliacao = await avaliacaoModel.buscarPorChamadoCliente(
    21,
    8,
    executor,
  )

  assert.equal(avaliacao, null)
  assert.match(chamadas[0].sql, /WHERE chamado_id = \? AND cliente_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [21, 8])
})
