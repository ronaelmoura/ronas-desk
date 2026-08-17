import assert from 'node:assert/strict'
import test from 'node:test'

import { criarEquipeMiddleware } from '../src/middlewares/equipeMiddleware.js'
import usuarioModel from '../src/models/usuarioModel.js'

function criarResposta() {
  return {
    statusCode: null,
    body: null,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('equipeMiddleware rejeita usuário inexistente', async () => {
  const response = criarResposta()
  const middleware = criarEquipeMiddleware({
    usuarios: { buscarPorId: async () => null },
  })

  await middleware({ usuario: { id: 99 } }, response, () => {
    throw new Error('next não deveria ser chamado')
  })

  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Esta área é exclusiva para a equipe de atendimento.',
  })
})

test('equipeMiddleware rejeita usuário inativo', async () => {
  const response = criarResposta()
  const middleware = criarEquipeMiddleware({
    usuarios: {
      buscarPorId: async () => ({ id: 2, ativo: false, cargo: 'Atendente' }),
    },
  })

  await middleware({ usuario: { id: 2 } }, response, () => {
    throw new Error('next não deveria ser chamado')
  })

  assert.equal(response.statusCode, 403)
})

test('equipeMiddleware rejeita usuário Cliente', async () => {
  const response = criarResposta()
  const middleware = criarEquipeMiddleware({
    usuarios: {
      buscarPorId: async () => ({ id: 7, ativo: true, cargo: 'Cliente' }),
    },
  })

  await middleware({ usuario: { id: 7 } }, response, () => {
    throw new Error('next não deveria ser chamado')
  })

  assert.equal(response.statusCode, 403)
})

test('equipeMiddleware permite usuário da equipe e substitui cargo antigo do JWT pelo do banco', async () => {
  const response = criarResposta()
  const middleware = criarEquipeMiddleware({
    usuarios: {
      buscarPorId: async () => ({ id: 5, ativo: true, cargo: 'Administrador' }),
    },
  })
  const request = { usuario: { id: 5, cargo: 'Cliente' } }
  let proximoFoiChamado = false

  await middleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, true)
  assert.equal(response.statusCode, null)
  assert.equal(request.usuario.cargo, 'Administrador')
})

test('equipeMiddleware responde 500 quando a consulta ao banco falha', async () => {
  const response = criarResposta()
  const middleware = criarEquipeMiddleware({
    usuarios: {
      buscarPorId: async () => {
        throw new Error('falha no banco')
      },
    },
  })

  await middleware({ usuario: { id: 44 } }, response, () => {
    throw new Error('next não deveria ser chamado')
  })

  assert.equal(response.statusCode, 500)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Não foi possível validar o acesso do usuário.',
  })
})

test('equipeMiddleware usa a revalidação no banco como fonte de verdade sobre o cargo', async () => {
  const original = usuarioModel.buscarPorId
  const response = criarResposta()
  const middleware = criarEquipeMiddleware()
  const request = { usuario: { id: 19, cargo: 'Cliente' } }
  let proximoFoiChamado = false

  usuarioModel.buscarPorId = async () => ({
    id: 19,
    ativo: true,
    cargo: 'Atendente',
  })

  try {
    await middleware(request, response, () => {
      proximoFoiChamado = true
    })

    assert.equal(proximoFoiChamado, true)
    assert.equal(request.usuario.cargo, 'Atendente')
  } finally {
    usuarioModel.buscarPorId = original
  }
})
