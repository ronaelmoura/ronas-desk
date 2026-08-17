import assert from 'node:assert/strict'
import test from 'node:test'

import chamadosController from '../src/controllers/chamadosController.js'
import anexoModel from '../src/models/anexoModel.js'
import chamadoModel from '../src/models/chamadoModel.js'
import pool from '../src/database/db.js'

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

test('chamadosController rejeita busca por id inválido', async () => {
  const response = criarResposta()

  await chamadosController.buscarPorId({ params: { id: 'abc' } }, response)

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'ID inválido.',
  })
})

test('chamadosController responde 404 quando o chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId
  chamadoModel.buscarPorId = async () => null

  try {
    await chamadosController.buscarPorId({ params: { id: '42' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('chamadosController rejeita payload inválido ao criar chamado', async () => {
  const response = criarResposta()

  await chamadosController.criar(
    {
      body: {
        cliente_id: 'abc',
        titulo: '  ',
        descricao: '  ',
        categoria: 'Hardware',
        prioridade: 'Alta',
      },
      usuario: { id: 1 },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Selecione um cliente válido.',
  })
})

test('chamadosController responde 404 ao atualizar chamado inexistente', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorIdParaAtualizacao
  const originalPool = pool.getConnection
  let rollbackChamado = false

  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    rollback: async () => {
      rollbackChamado = true
    },
    commit: async () => {},
    release: () => {},
  })
  chamadoModel.buscarPorIdParaAtualizacao = async () => null

  try {
    await chamadosController.atualizar(
      {
        params: { id: '9' },
        body: { titulo: 'Novo título', descricao: 'Nova descrição' },
        usuario: { id: 4 },
      },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
    assert.equal(rollbackChamado, true)
  } finally {
    chamadoModel.buscarPorIdParaAtualizacao = original
    pool.getConnection = originalPool
  }
})

test('chamadosController rejeita exclusão com anexos pendentes', async () => {
  const response = criarResposta()
  const originalBuscar = chamadoModel.buscarPorIdParaAtualizacao
  const originalAnexo = anexoModel.contarPorChamado
  const originalPool = pool.getConnection
  let rollbackChamado = false

  chamadoModel.buscarPorIdParaAtualizacao = async () => ({ id: 24 })
  anexoModel.contarPorChamado = async () => 3
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    rollback: async () => {
      rollbackChamado = true
    },
    commit: async () => {},
    release: () => {},
  })

  try {
    await chamadosController.excluir(
      { params: { id: '24' }, usuario: { id: 10 } },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Exclua os anexos do chamado antes de excluir o chamado.',
    })
    assert.equal(rollbackChamado, true)
  } finally {
    chamadoModel.buscarPorIdParaAtualizacao = originalBuscar
    anexoModel.contarPorChamado = originalAnexo
    pool.getConnection = originalPool
  }
})
