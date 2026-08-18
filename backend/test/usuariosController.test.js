import assert from 'node:assert/strict'
import test from 'node:test'

import usuariosController from '../src/controllers/usuariosController.js'
import usuarioModel from '../src/models/usuarioModel.js'
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

test('usuariosController lista usuários com sucesso', async () => {
  const response = criarResposta()
  const original = usuarioModel.listarPaginado

  usuarioModel.listarPaginado = async () => ({
    dados: [{ id: 1, nome: 'Ana', email: 'ana@empresa.com', cargo: 'Atendente', cliente_id: null, ativo: true, is_demo: false }],
    total: 1,
  })

  try {
    await usuariosController.listar({ query: { pagina: '1', limite: '10' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.paginacao.total, 1)
    assert.equal(response.body.dados[0].email, 'ana@empresa.com')
  } finally {
    usuarioModel.listarPaginado = original
  }
})

test('usuariosController busca usuário por id', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId

  usuarioModel.buscarPorId = async () => ({
    id: 2,
    nome: 'Bruno',
    email: 'bruno@empresa.com',
    cargo: 'Administrador',
    cliente_id: null,
    ativo: true,
    is_demo: false,
  })

  try {
    await usuariosController.buscarPorId({ params: { id: '2' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.email, 'bruno@empresa.com')
    assert.equal(response.body.id, 2)
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('usuariosController responde 404 quando usuário não existe', async () => {
  const response = criarResposta()
  const original = usuarioModel.buscarPorId

  usuarioModel.buscarPorId = async () => null

  try {
    await usuariosController.buscarPorId({ params: { id: '999' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Usuário não encontrado.',
    })
  } finally {
    usuarioModel.buscarPorId = original
  }
})

test('usuariosController cria usuário válido como administrador', async () => {
  const response = criarResposta()
  const originalBuscarEmail = usuarioModel.buscarPorEmail
  const originalCriar = usuarioModel.criar
  const originalCliente = clienteModel.buscarPorId

  usuarioModel.buscarPorEmail = async () => null
  usuarioModel.criar = async (dados) => ({
    id: 44,
    nome: dados.nome,
    email: dados.email,
    cargo: dados.cargo,
    cliente_id: null,
    ativo: true,
    is_demo: false,
  })
  clienteModel.buscarPorId = async () => null

  try {
    await usuariosController.criar(
      {
        body: {
          nome: 'Carla',
          email: 'carla@empresa.com',
          cargo: 'Atendente',
          senha: 'senha1234',
        },
        usuario: { cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.id, 44)
    assert.equal(response.body.email, 'carla@empresa.com')
    assert.equal('senha_hash' in response.body, false)
  } finally {
    usuarioModel.buscarPorEmail = originalBuscarEmail
    usuarioModel.criar = originalCriar
    clienteModel.buscarPorId = originalCliente
  }
})

test('usuariosController rejeita criação com payload inválido', async () => {
  const response = criarResposta()

  await usuariosController.criar(
    {
      body: {
        nome: '   ',
        email: 'email-invalido',
        cargo: 'Atendente',
      },
      usuario: { cargo: 'Administrador' },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Nome, email, cargo e senha são obrigatórios.',
  })
})

test('usuariosController responde 409 quando email já está em uso', async () => {
  const response = criarResposta()
  const originalBuscarEmail = usuarioModel.buscarPorEmail
  const originalCliente = clienteModel.buscarPorId

  usuarioModel.buscarPorEmail = async () => ({ id: 8, email: 'jaexiste@empresa.com' })
  clienteModel.buscarPorId = async () => null

  try {
    await usuariosController.criar(
      {
        body: {
          nome: 'Diana',
          email: 'jaexiste@empresa.com',
          cargo: 'Atendente',
          senha: 'senha1234',
        },
        usuario: { cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Já existe um usuário com este email.',
    })
  } finally {
    usuarioModel.buscarPorEmail = originalBuscarEmail
    clienteModel.buscarPorId = originalCliente
  }
})

test('usuariosController atualiza usuário válido', async () => {
  const response = criarResposta()
  const originalBuscarPorId = usuarioModel.buscarPorId
  const originalBuscarPorEmail = usuarioModel.buscarPorEmail
  const originalAtualizar = usuarioModel.atualizar

  usuarioModel.buscarPorId = async () => ({ id: 5, nome: 'Edu', email: 'edu@empresa.com', cargo: 'Atendente', cliente_id: null, ativo: true, is_demo: false })
  usuarioModel.buscarPorEmail = async () => null
  usuarioModel.atualizar = async () => ({
    id: 5,
    nome: 'Eduardo',
    email: 'eduardo@empresa.com',
    cargo: 'Atendente',
    cliente_id: null,
    ativo: true,
    is_demo: false,
  })

  try {
    await usuariosController.atualizar(
      {
        params: { id: '5' },
        body: {
          nome: 'Eduardo',
          email: 'eduardo@empresa.com',
          cargo: 'Atendente',
        },
        usuario: { cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.email, 'eduardo@empresa.com')
    assert.equal(response.body.nome, 'Eduardo')
  } finally {
    usuarioModel.buscarPorId = originalBuscarPorId
    usuarioModel.buscarPorEmail = originalBuscarPorEmail
    usuarioModel.atualizar = originalAtualizar
  }
})

test('usuariosController bloqueia auto-desativação no alterar status', async () => {
  const response = criarResposta()

  await usuariosController.alterarStatus(
    {
      params: { id: '7' },
      body: { ativo: false },
      usuario: { id: 7, cargo: 'Administrador' },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Você não pode desativar a própria conta.',
  })
})

test('usuariosController bloqueia exclusão da própria conta', async () => {
  const response = criarResposta()

  await usuariosController.excluir(
    {
      params: { id: '9' },
      usuario: { id: 9, cargo: 'Administrador' },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Você não pode excluir a própria conta.',
  })
})

test('usuariosController rejeita criação sem permissão administrativa', async () => {
  const response = criarResposta()

  await usuariosController.criar(
    {
      body: {
        nome: 'Eva',
        email: 'eva@empresa.com',
        cargo: 'Atendente',
        senha: 'senha1234',
      },
      usuario: { id: 10, cargo: 'Atendente' },
    },
    response,
  )

  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Apenas administradores podem gerenciar usuários.',
  })
})

test('usuariosController rejeita atualização sem permissão administrativa', async () => {
  const response = criarResposta()

  await usuariosController.atualizar(
    {
      params: { id: '2' },
      body: { nome: 'Bruno Atualizado' },
      usuario: { id: 11, cargo: 'Atendente' },
    },
    response,
  )

  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Apenas administradores podem gerenciar usuários.',
  })
})

test('usuariosController responde 500 quando banco falha ao criar', async () => {
  const response = criarResposta()
  const originalBuscarEmail = usuarioModel.buscarPorEmail
  const originalCriar = usuarioModel.criar
  const originalCliente = clienteModel.buscarPorId
  const originalConsoleError = console.error

  usuarioModel.buscarPorEmail = async () => null
  usuarioModel.criar = async () => {
    throw new Error('falha do banco')
  }
  clienteModel.buscarPorId = async () => null
  console.error = () => {}

  try {
    await usuariosController.criar(
      {
        body: {
          nome: 'Fábio',
          email: 'fabio@empresa.com',
          cargo: 'Atendente',
          senha: 'senha1234',
        },
        usuario: { cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    usuarioModel.buscarPorEmail = originalBuscarEmail
    usuarioModel.criar = originalCriar
    clienteModel.buscarPorId = originalCliente
    console.error = originalConsoleError
  }
})

test('usuariosController altera status de usuário com sucesso', async () => {
  const response = criarResposta()
  const original = usuarioModel.alterarStatus

  usuarioModel.alterarStatus = async () => ({
    id: 12,
    nome: 'Giancarlo',
    email: 'giancarlo@empresa.com',
    cargo: 'Atendente',
    cliente_id: null,
    ativo: false,
    is_demo: false,
  })

  try {
    await usuariosController.alterarStatus(
      {
        params: { id: '12' },
        body: { ativo: false },
        usuario: { id: 1, cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.ativo, false)
    assert.equal(response.body.id, 12)
  } finally {
    usuarioModel.alterarStatus = original
  }
})

test('usuariosController responde 500 quando banco falha ao alterar status', async () => {
  const response = criarResposta()
  const original = usuarioModel.alterarStatus
  const originalConsoleError = console.error

  usuarioModel.alterarStatus = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await usuariosController.alterarStatus(
      {
        params: { id: '15' },
        body: { ativo: false },
        usuario: { id: 1, cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    usuarioModel.alterarStatus = original
    console.error = originalConsoleError
  }
})

test('usuariosController responde 500 quando banco falha ao atualizar', async () => {
  const response = criarResposta()
  const originalBuscarId = usuarioModel.buscarPorId
  const originalBuscarEmail = usuarioModel.buscarPorEmail
  const originalAtualizar = usuarioModel.atualizar
  const originalConsoleError = console.error

  usuarioModel.buscarPorId = async () => ({ id: 2, email: 'bruno@empresa.com', cargo: 'Atendente' })
  usuarioModel.buscarPorEmail = async () => null
  usuarioModel.atualizar = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await usuariosController.atualizar(
      {
        params: { id: '2' },
        body: { nome: 'Bruno Novo', email: 'bruno.novo@empresa.com', cargo: 'Atendente' },
        usuario: { id: 1, cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    usuarioModel.buscarPorId = originalBuscarId
    usuarioModel.buscarPorEmail = originalBuscarEmail
    usuarioModel.atualizar = originalAtualizar
    console.error = originalConsoleError
  }
})

test('usuariosController responde 500 quando banco falha ao excluir', async () => {
  const response = criarResposta()
  const original = usuarioModel.excluir
  const originalConsoleError = console.error

  usuarioModel.excluir = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await usuariosController.excluir(
      {
        params: { id: '20' },
        usuario: { id: 1, cargo: 'Administrador' },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível concluir a operação.',
    })
  } finally {
    usuarioModel.excluir = original
    console.error = originalConsoleError
  }
})
