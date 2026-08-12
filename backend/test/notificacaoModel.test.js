import assert from 'node:assert/strict'
import test from 'node:test'

import notificacaoModel from '../src/models/notificacaoModel.js'

test('marca notificação apenas quando ela pertence ao usuário', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }

  const atualizada = await notificacaoModel.marcarComoLida(6, 3, executor)

  assert.equal(atualizada, true)
  assert.match(chamadas[0].sql, /WHERE id = \? AND usuario_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [6, 3])
})
