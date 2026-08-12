import assert from 'node:assert/strict'
import test from 'node:test'

import { criarEquipeMiddleware } from '../src/middlewares/equipeMiddleware.js'
import { criarPortalClienteMiddleware } from '../src/middlewares/portalClienteMiddleware.js'

function criarResponse() {
  return {
    codigo: null,
    corpo: null,
    status(codigo) {
      this.codigo = codigo
      return this
    },
    json(corpo) {
      this.corpo = corpo
      return this
    },
  }
}

test('portal permite somente a conta ativa vinculada ao cliente', async () => {
  const middleware = criarPortalClienteMiddleware({
    usuarios: {
      buscarPorId: async () => ({
        id: 7,
        ativo: true,
        is_demo: false,
        cargo: 'Cliente',
        cliente_id: 15,
      }),
    },
    clientes: { buscarPorId: async () => ({ id: 15, nome: 'Empresa Teste' }) },
  })
  const request = { usuario: { id: 7, cargo: 'Cliente' } }
  const response = criarResponse()
  let proximoFoiChamado = false

  await middleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, true)
  assert.equal(response.codigo, null)
  assert.equal(request.usuario.cliente_id, 15)
  assert.equal(request.cliente.nome, 'Empresa Teste')
})

test('portal rejeita usuários que não são clientes', async () => {
  const middleware = criarPortalClienteMiddleware({
    usuarios: {
      buscarPorId: async () => ({
        ativo: true,
        is_demo: false,
        cargo: 'Atendente',
      }),
    },
    clientes: {
      buscarPorId: async () => assert.fail('não deve consultar cliente'),
    },
  })
  const response = criarResponse()

  await middleware({ usuario: { id: 4 } }, response, () =>
    assert.fail('não deve avançar'),
  )

  assert.equal(response.codigo, 403)
})

test('painel interno rejeita conta de cliente', async () => {
  const middleware = criarEquipeMiddleware({
    usuarios: { buscarPorId: async () => ({ ativo: true, cargo: 'Cliente' }) },
  })
  const response = criarResponse()

  await middleware({ usuario: { id: 7 } }, response, () =>
    assert.fail('não deve avançar'),
  )

  assert.equal(response.codigo, 403)
})
