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

test('chamadosController cria chamado válido com transação, histórico e notificação', async () => {
  const response = criarResposta()
  const originalCliente = chamadoModel.buscarClienteAtivo
  const originalResponsavel = chamadoModel.buscarResponsavelAtivo
  const originalCriar = chamadoModel.criar
  const originalHistorico = (await import('../src/services/historyService.js')).default.registrarCriacao
  const originalNotificacao = (await import('../src/services/notificacaoService.js')).default.novoChamado
  const originalPool = pool.getConnection

  chamadoModel.buscarClienteAtivo = async () => ({ id: 7, ativo: true })
  chamadoModel.buscarResponsavelAtivo = async () => ({ id: 2, ativo: true })
  chamadoModel.criar = async (dados, executor) => ({
    ...dados,
    id: 101,
    cliente_id: 7,
    responsavel_id: 2,
    titulo: 'Título do chamado',
    descricao: 'Descrição valida',
    status: 'Novo',
    created_at: '2026-08-17T00:00:00.000Z',
    updated_at: '2026-08-17T00:00:00.000Z',
    resolved_at: null,
    sla_started_at: '2026-08-17T00:00:00.000Z',
    executor,
  })
  const historyService = (await import('../src/services/historyService.js')).default
  const notificacaoService = (await import('../src/services/notificacaoService.js')).default
  historyService.registrarCriacao = async () => {}
  notificacaoService.novoChamado = async () => {}
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
  })

  try {
    await chamadosController.criar(
      {
        body: {
          cliente_id: '7',
          responsavel_id: '2',
          titulo: '  Título do chamado  ',
          descricao: '  Descrição valida  ',
          categoria: 'Hardware',
          prioridade: 'Alta',
          status: 'Novo',
        },
        usuario: { id: 99 },
      },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.id, 101)
    assert.equal(response.body.titulo, 'Título do chamado')
    assert.equal(response.body.status, 'Novo')
  } finally {
    chamadoModel.buscarClienteAtivo = originalCliente
    chamadoModel.buscarResponsavelAtivo = originalResponsavel
    chamadoModel.criar = originalCriar
    const historyServiceReset = (await import('../src/services/historyService.js')).default
    const notificacaoServiceReset = (await import('../src/services/notificacaoService.js')).default
    historyServiceReset.registrarCriacao = originalHistorico
    notificacaoServiceReset.novoChamado = originalNotificacao
    pool.getConnection = originalPool
  }
})

test('chamadosController rejeita criação quando cliente ou responsável são inválidos', async () => {
  const response = criarResposta()
  const originalCliente = chamadoModel.buscarClienteAtivo
  const originalResponsavel = chamadoModel.buscarResponsavelAtivo

  chamadoModel.buscarClienteAtivo = async () => null

  try {
    await chamadosController.criar(
      {
        body: {
          cliente_id: '3',
          responsavel_id: '5',
          titulo: 'Título',
          descricao: 'Descricao',
          categoria: 'Software',
          prioridade: 'Média',
        },
        usuario: { id: 9 },
      },
      response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Cliente não encontrado ou inativo.',
    })
  } finally {
    chamadoModel.buscarClienteAtivo = originalCliente
    chamadoModel.buscarResponsavelAtivo = originalResponsavel
  }
})

test('chamadosController falha ao atualizar com erro do banco e faz rollback', async () => {
  const response = criarResposta()
  const originalBuscar = chamadoModel.buscarPorIdParaAtualizacao
  const originalPool = pool.getConnection
  let rollbackExecutado = false

  chamadoModel.buscarPorIdParaAtualizacao = async () => ({
    id: 12,
    cliente_id: 3,
    responsavel_id: null,
    titulo: 'Antigo',
    descricao: 'Descricao antiga',
    categoria: 'Hardware',
    prioridade: 'Alta',
    status: 'Novo',
    resolved_at: null,
    sla_started_at: '2026-08-01T00:00:00.000Z',
  })
  chamadoModel.buscarClienteAtivo = async () => ({ id: 3, ativo: true })
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    rollback: async () => {
      rollbackExecutado = true
    },
    commit: async () => {},
    release: () => {},
  })
  chamadoModel.atualizar = async () => {
    throw new Error('falha do banco')
  }

  try {
    await chamadosController.atualizar(
      {
        params: { id: '12' },
        body: { titulo: 'Novo título', descricao: 'Nova descrição', categoria: 'Software', prioridade: 'Baixa' },
        usuario: { id: 4 },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível atualizar o chamado.',
    })
    assert.equal(rollbackExecutado, true)
  } finally {
    chamadoModel.buscarPorIdParaAtualizacao = originalBuscar
    pool.getConnection = originalPool
  }
})

test('chamadosController lista chamados com filtros válidos e responde 400 para filtro inválido', async () => {
  const response = criarResposta()
  const originalListar = chamadoModel.listarPaginado
  chamadoModel.listarPaginado = async () => ({
    dados: [{ id: 1, titulo: 'A' }],
    total: 1,
  })

  try {
    await chamadosController.listar(
      { query: { status: 'Novo', prioridade: 'Alta', categoria: 'Hardware' } },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.paginacao.total, 1)
    assert.equal(response.body.dados[0].id, 1)

    const invalid = criarResposta()
    await chamadosController.listar(
      { query: { categoria: 'Categoria inventada' } },
      invalid,
    )
    assert.equal(invalid.statusCode, 400)
    assert.deepEqual(invalid.body, {
      status: 'erro',
      message: 'Categoria inválida.',
    })
  } finally {
    chamadoModel.listarPaginado = originalListar
  }
})
