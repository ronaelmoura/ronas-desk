import assert from 'node:assert/strict'
import test from 'node:test'
import chamadoModel from '../src/models/chamadoModel.js'

test('lista chamados com a data da primeira resposta', async () => {
  const chamados = [
    {
      id: 9,
      first_response_at: new Date('2026-08-01T12:30:00.000Z'),
    },
  ]
  const chamadas = []
  const executor = {
    async query(sql) {
      chamadas.push(sql)
      return [chamados, []]
    },
  }

  const resultado = await chamadoModel.listar(executor)

  assert.equal(resultado, chamados)
  assert.equal(chamadas.length, 1)
  assert.match(chamadas[0], /chamados\.first_response_at/)
})
