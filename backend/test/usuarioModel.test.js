import assert from 'node:assert/strict'
import test from 'node:test'
import usuarioModel from '../src/models/usuarioModel.js'

test('redefine senha por email somente para usuário ativo', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }

  const atualizado = await usuarioModel.atualizarSenhaPorEmail(
    'admin@example.com',
    'hash-seguro',
    executor,
  )

  assert.equal(atualizado, true)
  assert.match(chamadas[0].sql, /UPDATE usuarios/)
  assert.match(chamadas[0].sql, /email = \?/)
  assert.match(chamadas[0].sql, /ativo = 1/)
  assert.deepEqual(chamadas[0].parametros, ['hash-seguro', 'admin@example.com'])
})
