import assert from 'node:assert/strict'
import test from 'node:test'

import portalClienteController from '../src/controllers/portalClienteController.js'
import chamadoModel from '../src/models/chamadoModel.js'

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

test('portal do cliente não permite visualizar chamado de outro cliente', async () => {
  const response = criarResposta()
  const originalBuscar = chamadoModel.buscarPorIdDoCliente
  chamadoModel.buscarPorIdDoCliente = async (id, clienteId) => {
    assert.equal(id, 25)
    assert.equal(clienteId, 10)
    return null
  }

  try {
    await portalClienteController.buscarPorId(
      { params: { id: '25' }, usuario: { cliente_id: 10 } },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalBuscar
  }
})

test('portal do cliente não permite comentário em chamado de outro cliente', async () => {
  const response = criarResposta()
  const originalBuscar = chamadoModel.buscarPorIdParaAtualizacao
  const originalPool = (await import('../src/database/db.js')).default.getConnection

  chamadoModel.buscarPorIdParaAtualizacao = async () => ({
    id: 15,
    cliente_id: 99,
  })

  const conexao = {
    beginTransaction: async () => {},
    rollback: async () => {},
    release: () => {},
  }
  const db = await import('../src/database/db.js')
  db.default.getConnection = async () => conexao

  try {
    await portalClienteController.criarComentario(
      {
        params: { id: '15' },
        usuario: { id: 4, cliente_id: 7 },
        body: { conteudo: 'Mensagem privada do cliente A' },
      },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorIdParaAtualizacao = originalBuscar
    db.default.getConnection = originalPool
  }
})
