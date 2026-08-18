import assert from 'node:assert/strict'
import test from 'node:test'

import notificacoesController from '../src/controllers/notificacoesController.js'
import notificacaoModel from '../src/models/notificacaoModel.js'

function criarResposta() {
  return {
    statusCode: null,
    body: null,
    enviado: false,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    send() {
      this.enviado = true
      return this
    },
  }
}

test('notificacoesController lista notificações e total não lidas', async () => {
  const response = criarResposta()
  const originalListar = notificacaoModel.listarPorUsuario
  const originalContar = notificacaoModel.contarNaoLidas

  notificacaoModel.listarPorUsuario = async () => [{ id: 1, titulo: 'Chamado atualizado' }]
  notificacaoModel.contarNaoLidas = async () => 3

  try {
    await notificacoesController.listar({ usuario: { id: 9 } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.naoLidas, 3)
    assert.equal(response.body.notificacoes[0].titulo, 'Chamado atualizado')
  } finally {
    notificacaoModel.listarPorUsuario = originalListar
    notificacaoModel.contarNaoLidas = originalContar
  }
})

test('notificacoesController responde 500 quando falha ao listar', async () => {
  const response = criarResposta()
  const originalListar = notificacaoModel.listarPorUsuario
  const originalContar = notificacaoModel.contarNaoLidas
  const originalConsoleError = console.error

  notificacaoModel.listarPorUsuario = async () => {
    throw new Error('falha do banco')
  }
  notificacaoModel.contarNaoLidas = async () => 0
  console.error = () => {}

  try {
    await notificacoesController.listar({ usuario: { id: 9 } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar as notificações.',
    })
  } finally {
    notificacaoModel.listarPorUsuario = originalListar
    notificacaoModel.contarNaoLidas = originalContar
    console.error = originalConsoleError
  }
})

test('notificacoesController rejeita id inválido ao marcar como lida', async () => {
  const response = criarResposta()

  await notificacoesController.marcarComoLida(
    { params: { id: 'abc' }, usuario: { id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('notificacoesController responde 404 quando notificação não pertence ao usuário', async () => {
  const response = criarResposta()
  const original = notificacaoModel.marcarComoLida

  notificacaoModel.marcarComoLida = async () => false

  try {
    await notificacoesController.marcarComoLida(
      { params: { id: '5' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Notificação não encontrada.',
    })
  } finally {
    notificacaoModel.marcarComoLida = original
  }
})

test('notificacoesController marca notificação como lida com sucesso', async () => {
  const response = criarResposta()
  const original = notificacaoModel.marcarComoLida

  notificacaoModel.marcarComoLida = async () => true

  try {
    await notificacoesController.marcarComoLida(
      { params: { id: '5' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 204)
    assert.equal(response.enviado, true)
  } finally {
    notificacaoModel.marcarComoLida = original
  }
})

test('notificacoesController responde 500 quando falha ao marcar como lida', async () => {
  const response = criarResposta()
  const original = notificacaoModel.marcarComoLida
  const originalConsoleError = console.error

  notificacaoModel.marcarComoLida = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await notificacoesController.marcarComoLida(
      { params: { id: '5' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível atualizar a notificação.',
    })
  } finally {
    notificacaoModel.marcarComoLida = original
    console.error = originalConsoleError
  }
})

test('notificacoesController marca todas como lidas com sucesso', async () => {
  const response = criarResposta()
  const original = notificacaoModel.marcarTodasComoLidas
  let usuarioRecebido = null

  notificacaoModel.marcarTodasComoLidas = async (usuarioId) => {
    usuarioRecebido = usuarioId
  }

  try {
    await notificacoesController.marcarTodasComoLidas({ usuario: { id: 7 } }, response)

    assert.equal(response.statusCode, 204)
    assert.equal(response.enviado, true)
    assert.equal(usuarioRecebido, 7)
  } finally {
    notificacaoModel.marcarTodasComoLidas = original
  }
})

test('notificacoesController responde 500 quando falha ao marcar todas como lidas', async () => {
  const response = criarResposta()
  const original = notificacaoModel.marcarTodasComoLidas
  const originalConsoleError = console.error

  notificacaoModel.marcarTodasComoLidas = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await notificacoesController.marcarTodasComoLidas({ usuario: { id: 7 } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível atualizar as notificações.',
    })
  } finally {
    notificacaoModel.marcarTodasComoLidas = original
    console.error = originalConsoleError
  }
})
