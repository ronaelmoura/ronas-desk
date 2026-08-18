import assert from 'node:assert/strict'
import test from 'node:test'

import adminMiddleware from '../src/middlewares/adminMiddleware.js'
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

test('adminMiddleware rejeita usuário inexistente', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  usuarioModel.buscarPorId = async () => null

  try {
    await adminMiddleware({ usuario: { id: 999 } }, response, () => {
      throw new Error('next não deveria ser chamado')
    })

    assert.equal(response.statusCode, 403)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Apenas administradores podem executar esta ação.',
    })
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('adminMiddleware rejeita usuário inativo', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  usuarioModel.buscarPorId = async () => ({
    id: 3,
    nome: 'Usuário Inativo',
    email: 'inativo@example.com',
    cargo: 'Administrador',
    ativo: false,
    is_demo: false,
  })

  try {
    await adminMiddleware({ usuario: { id: 3 } }, response, () => {
      throw new Error('next não deveria ser chamado')
    })

    assert.equal(response.statusCode, 403)
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('adminMiddleware rejeita usuário demo', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  usuarioModel.buscarPorId = async () => ({
    id: 4,
    nome: 'Demo',
    email: 'demo@example.com',
    cargo: 'Administrador',
    ativo: true,
    is_demo: true,
  })

  try {
    await adminMiddleware({ usuario: { id: 4 } }, response, () => {
      throw new Error('next não deveria ser chamado')
    })

    assert.equal(response.statusCode, 403)
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('adminMiddleware rejeita cargo diferente de Administrador', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  usuarioModel.buscarPorId = async () => ({
    id: 8,
    nome: 'Atendente',
    email: 'atendente@example.com',
    cargo: 'Atendente',
    ativo: true,
    is_demo: false,
  })

  try {
    await adminMiddleware({ usuario: { id: 8 } }, response, () => {
      throw new Error('next não deveria ser chamado')
    })

    assert.equal(response.statusCode, 403)
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('adminMiddleware permite administrador válido e atualiza request.usuario', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  const request = { usuario: { id: 21 } }
  let proximoFoiChamado = false

  usuarioModel.buscarPorId = async () => ({
    id: 21,
    nome: 'Ronael',
    email: 'ronael@example.com',
    cargo: 'Administrador',
    ativo: true,
    is_demo: false,
  })

  try {
    await adminMiddleware(request, response, () => {
      proximoFoiChamado = true
    })

    assert.equal(proximoFoiChamado, true)
    assert.equal(response.statusCode, null)
    assert.deepEqual(request.usuario, {
      id: 21,
      nome: 'Ronael',
      email: 'ronael@example.com',
      cargo: 'Administrador',
    })
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('adminMiddleware responde 500 quando a consulta ao banco falha', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId
  usuarioModel.buscarPorId = async () => {
    throw new Error('falha no banco')
  }

  try {
    await adminMiddleware({ usuario: { id: 99 } }, response, () => {
      throw new Error('next não deveria ser chamado')
    })

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível validar a permissão do usuário.',
    })
  } finally {
    usuarioModel.buscarPorId = original
  }
})
