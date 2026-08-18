import assert from 'node:assert/strict'
import test from 'node:test'

import clientesController from '../src/controllers/clientesController.js'
import clienteModel from '../src/models/clienteModel.js'

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

test('clientesController lista clientes com sucesso', async () => {
  const response = criarResposta()
  const original = clienteModel.listarPaginado

  clienteModel.listarPaginado = async () => ({
    dados: [{ id: 1, nome: 'Cliente A', email: 'a@cliente.com', ativo: true }],
    total: 1,
  })

  try {
    await clientesController.listar({ query: { pagina: '1', limite: '10' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.paginacao.total, 1)
    assert.equal(response.body.dados[0].nome, 'Cliente A')
  } finally {
    clienteModel.listarPaginado = original
  }
})

test('clientesController busca cliente por id', async () => {
  const response = criarResposta()
  const original = clienteModel.buscarPorId

  clienteModel.buscarPorId = async () => ({
    id: 7,
    nome: 'Cliente B',
    email: 'b@cliente.com',
    telefone: '11999999999',
    empresa: 'Empresa B',
    ativo: true,
  })

  try {
    await clientesController.buscarPorId({ params: { id: '7' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.email, 'b@cliente.com')
    assert.equal(response.body.id, 7)
  } finally {
    clienteModel.buscarPorId = original
  }
})

test('clientesController responde 404 quando cliente não existe', async () => {
  const response = criarResposta()
  const original = clienteModel.buscarPorId

  clienteModel.buscarPorId = async () => null

  try {
    await clientesController.buscarPorId({ params: { id: '999' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Cliente não encontrado.',
    })
  } finally {
    clienteModel.buscarPorId = original
  }
})

test('clientesController cria cliente válido', async () => {
  const response = criarResposta()
  const original = clienteModel.criar

  clienteModel.criar = async (dados) => ({
    id: 12,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    empresa: dados.empresa,
    ativo: dados.ativo,
  })

  try {
    await clientesController.criar(
      {
        body: {
          nome: 'Cliente C',
          email: 'c@cliente.com',
          telefone: '11988887777',
          empresa: 'Empresa C',
          ativo: true,
        },
      },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.email, 'c@cliente.com')
    assert.equal(response.body.id, 12)
  } finally {
    clienteModel.criar = original
  }
})

test('clientesController rejeita payload inválido ao criar cliente', async () => {
  const response = criarResposta()

  await clientesController.criar(
    {
      body: {
        nome: '   ',
        email: 'email-invalido',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Nome e email são obrigatórios.',
  })
})

test('clientesController atualiza cliente válido', async () => {
  const response = criarResposta()
  const originalBuscar = clienteModel.atualizar

  clienteModel.atualizar = async () => ({
    id: 3,
    nome: 'Cliente Atualizado',
    email: 'novo@cliente.com',
    telefone: null,
    empresa: null,
    ativo: true,
  })

  try {
    await clientesController.atualizar(
      {
        params: { id: '3' },
        body: {
          nome: 'Cliente Atualizado',
          email: 'novo@cliente.com',
          ativo: true,
        },
      },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.email, 'novo@cliente.com')
    assert.equal(response.body.nome, 'Cliente Atualizado')
  } finally {
    clienteModel.atualizar = originalBuscar
  }
})

test('clientesController desativa cliente com sucesso', async () => {
  const response = criarResposta()
  const original = clienteModel.desativar

  clienteModel.desativar = async () => true

  try {
    await clientesController.excluir({ params: { id: '4' } }, response)

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, {
      status: 'sucesso',
      message: 'Cliente desativado com sucesso.',
    })
  } finally {
    clienteModel.desativar = original
  }
})

test('clientesController responde 500 quando o banco falha no listar', async () => {
  const response = criarResposta()
  const original = clienteModel.listarPaginado

  clienteModel.listarPaginado = async () => {
    throw Object.assign(new Error('falha do banco'), { code: 'ER_FATAL' })
  }

  try {
    await clientesController.listar({ query: {} }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    clienteModel.listarPaginado = original
  }
})

test('clientesController lista chamados do cliente com sucesso', async () => {
  const response = criarResposta()
  const originalBuscarPorId = clienteModel.buscarPorId
  const originalBuscarChamados = clienteModel.buscarChamados

  clienteModel.buscarPorId = async () => ({ id: 1, nome: 'Cliente A', email: 'a@cliente.com', ativo: true })
  clienteModel.buscarChamados = async () => [
    { id: 101, titulo: 'Chamado 1', status: 'Novo', prioridade: 'Alta', created_at: '2026-08-01T10:00:00Z' },
  ]

  try {
    await clientesController.listarChamados({ params: { id: '1' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(Array.isArray(response.body), true)
    assert.equal(response.body.length, 1)
    assert.equal(response.body[0].titulo, 'Chamado 1')
  } finally {
    clienteModel.buscarPorId = originalBuscarPorId
    clienteModel.buscarChamados = originalBuscarChamados
  }
})

test('clientesController responde 404 ao listar chamados de cliente inexistente', async () => {
  const response = criarResposta()
  const original = clienteModel.buscarPorId

  clienteModel.buscarPorId = async () => null

  try {
    await clientesController.listarChamados({ params: { id: '999' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Cliente não encontrado.',
    })
  } finally {
    clienteModel.buscarPorId = original
  }
})

test('clientesController responde 404 ao atualizar cliente inexistente', async () => {
  const response = criarResposta()
  const original = clienteModel.atualizar

  clienteModel.atualizar = async () => null

  try {
    await clientesController.atualizar(
      {
        params: { id: '999' },
        body: { nome: 'Atualizado', email: 'atualizado@cliente.com' },
      },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Cliente não encontrado.',
    })
  } finally {
    clienteModel.atualizar = original
  }
})

test('clientesController responde 409 quando email já existe ao criar', async () => {
  const response = criarResposta()
  const original = clienteModel.criar
  const originalConsoleError = console.error

  clienteModel.criar = async () => {
    const erro = new Error('Duplicate entry')
    erro.code = 'ER_DUP_ENTRY'
    throw erro
  }
  console.error = () => {}

  try {
    await clientesController.criar(
      {
        body: {
          nome: 'Cliente Duplicado',
          email: 'duplicado@cliente.com',
        },
      },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Já existe um cliente com este email.',
    })
  } finally {
    clienteModel.criar = original
    console.error = originalConsoleError
  }
})

test('clientesController responde 500 quando banco falha ao excluir cliente', async () => {
  const response = criarResposta()
  const original = clienteModel.desativar
  const originalConsoleError = console.error

  clienteModel.desativar = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await clientesController.excluir({ params: { id: '25' } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    clienteModel.desativar = original
    console.error = originalConsoleError
  }
})
