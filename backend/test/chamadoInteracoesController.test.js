import assert from 'node:assert/strict'
import test from 'node:test'

import chamadoInteracoesController from '../src/controllers/chamadoInteracoesController.js'
import pool from '../src/database/db.js'
import chamadoModel from '../src/models/chamadoModel.js'
import comentarioModel from '../src/models/comentarioModel.js'
import historyService from '../src/services/historyService.js'
import primeiraRespostaService from '../src/services/primeiraRespostaService.js'
import notificacaoService from '../src/services/notificacaoService.js'

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

function criarConexaoFake() {
  return {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  }
}

test('chamadoInteracoesController listarHistorico rejeita id inválido', async () => {
  const response = criarResposta()

  await chamadoInteracoesController.listarHistorico({ params: { id: 'abc' } }, response)

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('chamadoInteracoesController listarHistorico responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await chamadoInteracoesController.listarHistorico({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('chamadoInteracoesController listarHistorico retorna histórico com sucesso', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalHistorico = historyService.listarPorChamado

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  historyService.listarPorChamado = async () => [{ id: 1, acao: 'criado' }]

  try {
    await chamadoInteracoesController.listarHistorico({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body[0].acao, 'criado')
  } finally {
    chamadoModel.buscarPorId = originalChamado
    historyService.listarPorChamado = originalHistorico
  }
})

test('chamadoInteracoesController listarTimeline delega para listarHistorico', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalHistorico = historyService.listarPorChamado

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  historyService.listarPorChamado = async () => [{ id: 2, acao: 'comentario' }]

  try {
    await chamadoInteracoesController.listarTimeline({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body[0].acao, 'comentario')
  } finally {
    chamadoModel.buscarPorId = originalChamado
    historyService.listarPorChamado = originalHistorico
  }
})

test('chamadoInteracoesController listarHistorico responde 500 quando falha', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId
  const originalConsoleError = console.error

  chamadoModel.buscarPorId = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await chamadoInteracoesController.listarHistorico({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar o histórico.',
    })
  } finally {
    chamadoModel.buscarPorId = original
    console.error = originalConsoleError
  }
})

test('chamadoInteracoesController listarComentarios responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await chamadoInteracoesController.listarComentarios({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 404)
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('chamadoInteracoesController listarComentarios retorna comentários com sucesso', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalComentarios = comentarioModel.listarPorChamado

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.listarPorChamado = async () => [{ id: 1, conteudo: 'Olá' }]

  try {
    await chamadoInteracoesController.listarComentarios({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body[0].conteudo, 'Olá')
  } finally {
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.listarPorChamado = originalComentarios
  }
})

test('chamadoInteracoesController listarComentarios responde 500 quando falha', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId
  const originalConsoleError = console.error

  chamadoModel.buscarPorId = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await chamadoInteracoesController.listarComentarios({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar os comentários.',
    })
  } finally {
    chamadoModel.buscarPorId = original
    console.error = originalConsoleError
  }
})

test('chamadoInteracoesController criarComentario rejeita conteúdo vazio', async () => {
  const response = criarResposta()

  await chamadoInteracoesController.criarComentario(
    { params: { id: '5' }, body: { conteudo: '   ' }, usuario: { id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'O comentário deve ter entre 1 e 2000 caracteres.',
  })
})

test('chamadoInteracoesController criarComentario rejeita conteúdo muito longo', async () => {
  const response = criarResposta()

  await chamadoInteracoesController.criarComentario(
    { params: { id: '5' }, body: { conteudo: 'a'.repeat(2001) }, usuario: { id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'O comentário deve ter entre 1 e 2000 caracteres.',
  })
})

test('chamadoInteracoesController criarComentario rejeita tipo inválido', async () => {
  const response = criarResposta()

  await chamadoInteracoesController.criarComentario(
    { params: { id: '5' }, body: { conteudo: 'Olá', tipo: 'INVALIDO' }, usuario: { id: 1 } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'O tipo do comentário deve ser PUBLICO ou INTERNO.',
  })
})

test('chamadoInteracoesController criarComentario responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await chamadoInteracoesController.criarComentario(
      { params: { id: '5' }, body: { conteudo: 'Olá' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('chamadoInteracoesController criarComentario cria comentário PUBLICO e notifica a equipe', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalCriar = comentarioModel.criar
  const originalPrimeiraResposta = primeiraRespostaService.registrarSeAplicavel
  const originalHistorico = historyService.registrarComentario
  const originalNotificacao = notificacaoService.comentarioDaEquipe
  let comitado = false
  let notificado = false

  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    commit: async () => {
      comitado = true
    },
  })
  chamadoModel.buscarPorId = async () => ({ id: 5, titulo: 'Chamado teste' })
  comentarioModel.criar = async (dados) => ({ id: 10, ...dados })
  primeiraRespostaService.registrarSeAplicavel = async () => {}
  historyService.registrarComentario = async () => {}
  notificacaoService.comentarioDaEquipe = async () => {
    notificado = true
  }

  try {
    await chamadoInteracoesController.criarComentario(
      { params: { id: '5' }, body: { conteudo: 'Olá equipe', tipo: 'publico' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.conteudo, 'Olá equipe')
    assert.equal(response.body.tipo, 'PUBLICO')
    assert.equal(comitado, true)
    assert.equal(notificado, true)
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.criar = originalCriar
    primeiraRespostaService.registrarSeAplicavel = originalPrimeiraResposta
    historyService.registrarComentario = originalHistorico
    notificacaoService.comentarioDaEquipe = originalNotificacao
  }
})

test('chamadoInteracoesController criarComentario cria comentário INTERNO sem notificar', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalCriar = comentarioModel.criar
  const originalPrimeiraResposta = primeiraRespostaService.registrarSeAplicavel
  const originalHistorico = historyService.registrarComentario
  const originalNotificacao = notificacaoService.comentarioDaEquipe
  let notificado = false

  pool.getConnection = async () => criarConexaoFake()
  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.criar = async (dados) => ({ id: 11, ...dados })
  primeiraRespostaService.registrarSeAplicavel = async () => {}
  historyService.registrarComentario = async () => {}
  notificacaoService.comentarioDaEquipe = async () => {
    notificado = true
  }

  try {
    await chamadoInteracoesController.criarComentario(
      { params: { id: '5' }, body: { conteudo: 'Nota interna' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.tipo, 'INTERNO')
    assert.equal(notificado, false)
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.criar = originalCriar
    primeiraRespostaService.registrarSeAplicavel = originalPrimeiraResposta
    historyService.registrarComentario = originalHistorico
    notificacaoService.comentarioDaEquipe = originalNotificacao
  }
})

test('chamadoInteracoesController criarComentario reverte a transação quando o banco falha', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalCriar = comentarioModel.criar
  const originalConsoleError = console.error
  let revertido = false

  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    rollback: async () => {
      revertido = true
    },
  })
  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.criar = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await chamadoInteracoesController.criarComentario(
      { params: { id: '5' }, body: { conteudo: 'Olá' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível adicionar o comentário.',
    })
    assert.equal(revertido, true)
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.criar = originalCriar
    console.error = originalConsoleError
  }
})
