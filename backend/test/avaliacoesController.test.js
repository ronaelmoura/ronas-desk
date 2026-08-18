import assert from 'node:assert/strict'
import test from 'node:test'

import avaliacoesController from '../src/controllers/avaliacoesController.js'
import avaliacaoModel from '../src/models/avaliacaoModel.js'
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

test('avaliacoesController buscarDoPortal rejeita id inválido', async () => {
  const response = criarResposta()

  await avaliacoesController.buscarDoPortal(
    { params: { id: 'abc' }, usuario: { cliente_id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('avaliacoesController buscarDoPortal responde 404 quando chamado não existe para o cliente', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorIdDoCliente

  chamadoModel.buscarPorIdDoCliente = async () => null

  try {
    await avaliacoesController.buscarDoPortal(
      { params: { id: '5' }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = original
  }
})

test('avaliacoesController buscarDoPortal retorna avaliação com sucesso', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorIdDoCliente
  const originalBuscar = avaliacaoModel.buscarPorChamadoCliente

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Resolvido' })
  avaliacaoModel.buscarPorChamadoCliente = async () => ({ id: 1, nota: 5, comentario: '' })

  try {
    await avaliacoesController.buscarDoPortal(
      { params: { id: '5' }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.nota, 5)
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalChamado
    avaliacaoModel.buscarPorChamadoCliente = originalBuscar
  }
})

test('avaliacoesController buscarDoPortal responde 500 quando banco falha', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorIdDoCliente
  const originalConsoleError = console.error

  chamadoModel.buscarPorIdDoCliente = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await avaliacoesController.buscarDoPortal(
      { params: { id: '5' }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar a avaliação.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = original
    console.error = originalConsoleError
  }
})

test('avaliacoesController criarDoPortal rejeita id inválido', async () => {
  const response = criarResposta()

  await avaliacoesController.criarDoPortal(
    { params: { id: '0' }, body: { nota: 5 }, usuario: { cliente_id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('avaliacoesController criarDoPortal rejeita nota inválida', async () => {
  const response = criarResposta()

  await avaliacoesController.criarDoPortal(
    { params: { id: '5' }, body: { nota: 9 }, usuario: { cliente_id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'Escolha uma nota de 1 a 5.' })
})

test('avaliacoesController criarDoPortal rejeita comentário muito longo', async () => {
  const response = criarResposta()

  await avaliacoesController.criarDoPortal(
    { params: { id: '5' }, body: { nota: 4, comentario: 'a'.repeat(1001) }, usuario: { cliente_id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'O comentário deve ter no máximo 1000 caracteres.',
  })
})

test('avaliacoesController criarDoPortal responde 404 quando chamado não encontrado', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorIdDoCliente

  chamadoModel.buscarPorIdDoCliente = async () => null

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4 }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
  } finally {
    chamadoModel.buscarPorIdDoCliente = original
  }
})

test('avaliacoesController criarDoPortal responde 409 quando chamado ainda não foi encerrado', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorIdDoCliente

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Aberto' })

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4 }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'A avaliação fica disponível após a resolução do chamado.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = original
  }
})

test('avaliacoesController criarDoPortal responde 409 quando chamado já foi avaliado', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorIdDoCliente
  const originalBuscar = avaliacaoModel.buscarPorChamadoCliente

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Resolvido' })
  avaliacaoModel.buscarPorChamadoCliente = async () => ({ id: 1, nota: 5 })

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4 }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Este chamado já foi avaliado.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalChamado
    avaliacaoModel.buscarPorChamadoCliente = originalBuscar
  }
})

test('avaliacoesController criarDoPortal cria avaliação com sucesso', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorIdDoCliente
  const originalBuscar = avaliacaoModel.buscarPorChamadoCliente
  const originalCriar = avaliacaoModel.criar

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Resolvido' })
  avaliacaoModel.buscarPorChamadoCliente = async () => null
  avaliacaoModel.criar = async (dados) => ({ id: 10, ...dados })

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4, comentario: 'Ótimo atendimento' }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.nota, 4)
    assert.equal(response.body.comentario, 'Ótimo atendimento')
    assert.equal(response.body.chamado_id, 5)
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalChamado
    avaliacaoModel.buscarPorChamadoCliente = originalBuscar
    avaliacaoModel.criar = originalCriar
  }
})

test('avaliacoesController criarDoPortal trata corrida de duplicidade (ER_DUP_ENTRY)', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorIdDoCliente
  const originalBuscar = avaliacaoModel.buscarPorChamadoCliente
  const originalCriar = avaliacaoModel.criar
  const originalConsoleError = console.error

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Resolvido' })
  avaliacaoModel.buscarPorChamadoCliente = async () => null
  avaliacaoModel.criar = async () => {
    const erro = new Error('duplicado')
    erro.code = 'ER_DUP_ENTRY'
    throw erro
  }
  console.error = () => {}

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4 }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 409)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Este chamado já foi avaliado.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalChamado
    avaliacaoModel.buscarPorChamadoCliente = originalBuscar
    avaliacaoModel.criar = originalCriar
    console.error = originalConsoleError
  }
})

test('avaliacoesController criarDoPortal responde 500 quando banco falha', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorIdDoCliente
  const originalBuscar = avaliacaoModel.buscarPorChamadoCliente
  const originalCriar = avaliacaoModel.criar
  const originalConsoleError = console.error

  chamadoModel.buscarPorIdDoCliente = async () => ({ id: 5, status: 'Resolvido' })
  avaliacaoModel.buscarPorChamadoCliente = async () => null
  avaliacaoModel.criar = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await avaliacoesController.criarDoPortal(
      { params: { id: '5' }, body: { nota: 4 }, usuario: { cliente_id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível registrar a avaliação.',
    })
  } finally {
    chamadoModel.buscarPorIdDoCliente = originalChamado
    avaliacaoModel.buscarPorChamadoCliente = originalBuscar
    avaliacaoModel.criar = originalCriar
    console.error = originalConsoleError
  }
})

test('avaliacoesController listarParaAdministracao retorna avaliações e resumo', async () => {
  const response = criarResposta()
  const originalListar = avaliacaoModel.listarParaAdministracao
  const originalResumo = avaliacaoModel.obterResumo

  avaliacaoModel.listarParaAdministracao = async () => [{ id: 1, nota: 5 }]
  avaliacaoModel.obterResumo = async () => ({ media: 5, total: 1 })

  try {
    await avaliacoesController.listarParaAdministracao({}, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.avaliacoes.length, 1)
    assert.equal(response.body.resumo.media, 5)
  } finally {
    avaliacaoModel.listarParaAdministracao = originalListar
    avaliacaoModel.obterResumo = originalResumo
  }
})

test('avaliacoesController listarParaAdministracao responde 500 quando banco falha', async () => {
  const response = criarResposta()
  const originalListar = avaliacaoModel.listarParaAdministracao
  const originalResumo = avaliacaoModel.obterResumo
  const originalConsoleError = console.error

  avaliacaoModel.listarParaAdministracao = async () => {
    throw new Error('falha do banco')
  }
  avaliacaoModel.obterResumo = async () => ({})
  console.error = () => {}

  try {
    await avaliacoesController.listarParaAdministracao({}, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar as avaliações.',
    })
  } finally {
    avaliacaoModel.listarParaAdministracao = originalListar
    avaliacaoModel.obterResumo = originalResumo
    console.error = originalConsoleError
  }
})
