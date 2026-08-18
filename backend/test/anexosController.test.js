import assert from 'node:assert/strict'
import test from 'node:test'

import anexosController from '../src/controllers/anexosController.js'
import pool from '../src/database/db.js'
import anexoModel from '../src/models/anexoModel.js'
import chamadoModel from '../src/models/chamadoModel.js'
import anexoService, { CloudinaryNaoConfiguradoError } from '../src/services/anexoService.js'
import historyService from '../src/services/historyService.js'

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

const arquivoValido = {
  originalname: 'documento.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('%PDF-1.4 conteudo de teste'),
}

test('anexosController listar rejeita id inválido', async () => {
  const response = criarResposta()

  await anexosController.listar({ params: { id: 'abc' } }, response)

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('anexosController listar responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await anexosController.listar({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 404)
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('anexosController listar retorna anexos serializados', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalListar = anexoModel.listarPorChamado

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  anexoModel.listarPorChamado = async () => [
    {
      id: 1,
      chamado_id: 5,
      nome_original: 'nota.pdf',
      mime_type: 'application/pdf',
      tamanho_bytes: 100,
      created_at: '2026-01-01',
      usuario_id: 2,
      usuario_nome: 'Ana',
      public_id: 'segredo-interno',
    },
  ]

  try {
    await anexosController.listar({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body[0].nome_original, 'nota.pdf')
    assert.equal('public_id' in response.body[0], false)
  } finally {
    chamadoModel.buscarPorId = originalChamado
    anexoModel.listarPorChamado = originalListar
  }
})

test('anexosController listar responde 500 quando banco falha', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId
  const originalConsoleError = console.error

  chamadoModel.buscarPorId = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await anexosController.listar({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível carregar os anexos.',
    })
  } finally {
    chamadoModel.buscarPorId = original
    console.error = originalConsoleError
  }
})

test('anexosController criar rejeita id inválido', async () => {
  const response = criarResposta()

  await anexosController.criar({ params: { id: '0' }, file: arquivoValido }, response)

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('anexosController criar rejeita quando nenhum arquivo é enviado', async () => {
  const response = criarResposta()

  await anexosController.criar({ params: { id: '5' }, file: undefined }, response)

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.status, 'erro')
})

test('anexosController criar responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await anexosController.criar(
      { params: { id: '5' }, file: arquivoValido, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('anexosController criar registra anexo com sucesso', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalChamadoAtualizacao = chamadoModel.buscarPorIdParaAtualizacao
  const originalEnviar = anexoService.enviar
  const originalCriar = anexoModel.criar
  const originalHistorico = historyService.registrarAnexoAdicionado
  let comitado = false

  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    commit: async () => {
      comitado = true
    },
  })
  chamadoModel.buscarPorId = async () => ({ id: 5 })
  chamadoModel.buscarPorIdParaAtualizacao = async () => ({ id: 5 })
  anexoService.enviar = async () => ({ public_id: 'abc123', url: 'https://cdn/abc123', tamanho_bytes: 1024 })
  anexoModel.criar = async (dados) => ({ id: 20, ...dados })
  historyService.registrarAnexoAdicionado = async () => {}

  try {
    await anexosController.criar(
      { params: { id: '5' }, file: arquivoValido, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.id, 20)
    assert.equal(response.body.nome_original, 'documento.pdf')
    assert.equal(comitado, true)
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    chamadoModel.buscarPorIdParaAtualizacao = originalChamadoAtualizacao
    anexoService.enviar = originalEnviar
    anexoModel.criar = originalCriar
    historyService.registrarAnexoAdicionado = originalHistorico
  }
})

test('anexosController criar responde 503 e não deixa arquivo órfão quando Cloudinary não está configurado', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalEnviar = anexoService.enviar

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  anexoService.enviar = async () => {
    throw new CloudinaryNaoConfiguradoError('Armazenamento não configurado.')
  }

  try {
    await anexosController.criar(
      { params: { id: '5' }, file: arquivoValido, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 503)
  } finally {
    chamadoModel.buscarPorId = originalChamado
    anexoService.enviar = originalEnviar
  }
})

test('anexosController criar responde 404 e remove o arquivo quando o chamado some durante o envio', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalChamadoAtualizacao = chamadoModel.buscarPorIdParaAtualizacao
  const originalEnviar = anexoService.enviar
  const originalRemover = anexoService.remover
  let removido = false

  pool.getConnection = async () => criarConexaoFake()
  chamadoModel.buscarPorId = async () => ({ id: 5 })
  chamadoModel.buscarPorIdParaAtualizacao = async () => null
  anexoService.enviar = async () => ({ public_id: 'abc123', tamanho_bytes: 1024 })
  anexoService.remover = async () => {
    removido = true
  }

  try {
    await anexosController.criar(
      { params: { id: '5' }, file: arquivoValido, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
    assert.equal(removido, true)
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    chamadoModel.buscarPorIdParaAtualizacao = originalChamadoAtualizacao
    anexoService.enviar = originalEnviar
    anexoService.remover = originalRemover
  }
})

test('anexosController criar responde 500 quando o banco falha após o envio', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalChamado = chamadoModel.buscarPorId
  const originalChamadoAtualizacao = chamadoModel.buscarPorIdParaAtualizacao
  const originalEnviar = anexoService.enviar
  const originalCriar = anexoModel.criar
  const originalRemover = anexoService.remover
  const originalConsoleError = console.error

  pool.getConnection = async () => criarConexaoFake()
  chamadoModel.buscarPorId = async () => ({ id: 5 })
  chamadoModel.buscarPorIdParaAtualizacao = async () => ({ id: 5 })
  anexoService.enviar = async () => ({ public_id: 'abc123', tamanho_bytes: 1024 })
  anexoModel.criar = async () => {
    throw new Error('falha do banco')
  }
  anexoService.remover = async () => {}
  console.error = () => {}

  try {
    await anexosController.criar(
      { params: { id: '5' }, file: arquivoValido, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível registrar o anexo.',
    })
  } finally {
    pool.getConnection = originalPool
    chamadoModel.buscarPorId = originalChamado
    chamadoModel.buscarPorIdParaAtualizacao = originalChamadoAtualizacao
    anexoService.enviar = originalEnviar
    anexoModel.criar = originalCriar
    anexoService.remover = originalRemover
    console.error = originalConsoleError
  }
})

test('anexosController gerarDownload rejeita id inválido', async () => {
  const response = criarResposta()

  await anexosController.gerarDownload({ params: { id: 'x', anexoId: '1' } }, response)

  assert.equal(response.statusCode, 400)
})

test('anexosController gerarDownload responde 404 quando anexo não existe', async () => {
  const response = criarResposta()
  const original = anexoModel.buscarPorId

  anexoModel.buscarPorId = async () => null

  try {
    await anexosController.gerarDownload({ params: { id: '5', anexoId: '9' } }, response)

    assert.equal(response.statusCode, 404)
  } finally {
    anexoModel.buscarPorId = original
  }
})

test('anexosController gerarDownload retorna url temporária', async () => {
  const response = criarResposta()
  const originalBuscar = anexoModel.buscarPorId
  const originalUrl = anexoService.gerarUrlTemporaria

  anexoModel.buscarPorId = async () => ({ id: 9, public_id: 'abc' })
  anexoService.gerarUrlTemporaria = () => 'https://cdn/temp-url'

  try {
    await anexosController.gerarDownload({ params: { id: '5', anexoId: '9' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.url, 'https://cdn/temp-url')
    assert.equal(response.body.expires_in, 300)
  } finally {
    anexoModel.buscarPorId = originalBuscar
    anexoService.gerarUrlTemporaria = originalUrl
  }
})

test('anexosController gerarDownload responde 502 quando o armazenamento falha', async () => {
  const response = criarResposta()
  const originalBuscar = anexoModel.buscarPorId
  const originalUrl = anexoService.gerarUrlTemporaria
  const originalConsoleError = console.error

  anexoModel.buscarPorId = async () => ({ id: 9 })
  anexoService.gerarUrlTemporaria = () => {
    throw new Error('falha de rede')
  }
  console.error = () => {}

  try {
    await anexosController.gerarDownload({ params: { id: '5', anexoId: '9' } }, response)

    assert.equal(response.statusCode, 502)
  } finally {
    anexoModel.buscarPorId = originalBuscar
    anexoService.gerarUrlTemporaria = originalUrl
    console.error = originalConsoleError
  }
})

test('anexosController excluir rejeita id inválido', async () => {
  const response = criarResposta()

  await anexosController.excluir({ params: { id: 'x', anexoId: '1' } }, response)

  assert.equal(response.statusCode, 400)
})

test('anexosController excluir responde 404 quando anexo não existe', async () => {
  const response = criarResposta()
  const original = anexoModel.buscarPorId

  anexoModel.buscarPorId = async () => null

  try {
    await anexosController.excluir(
      { params: { id: '5', anexoId: '9' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
  } finally {
    anexoModel.buscarPorId = original
  }
})

test('anexosController excluir remove anexo com sucesso', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalBuscar = anexoModel.buscarPorId
  const originalBuscarAtualizacao = anexoModel.buscarPorIdParaAtualizacao
  const originalRemover = anexoService.remover
  const originalExcluir = anexoModel.excluir
  const originalHistorico = historyService.registrarAnexoRemovido
  let comitado = false

  anexoModel.buscarPorId = async () => ({ id: 9, public_id: 'abc' })
  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    commit: async () => {
      comitado = true
    },
  })
  anexoModel.buscarPorIdParaAtualizacao = async () => ({ id: 9, public_id: 'abc' })
  anexoService.remover = async () => {}
  anexoModel.excluir = async () => {}
  historyService.registrarAnexoRemovido = async () => {}

  try {
    await anexosController.excluir(
      { params: { id: '5', anexoId: '9' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, {
      status: 'sucesso',
      message: 'Anexo excluído com sucesso.',
    })
    assert.equal(comitado, true)
  } finally {
    pool.getConnection = originalPool
    anexoModel.buscarPorId = originalBuscar
    anexoModel.buscarPorIdParaAtualizacao = originalBuscarAtualizacao
    anexoService.remover = originalRemover
    anexoModel.excluir = originalExcluir
    historyService.registrarAnexoRemovido = originalHistorico
  }
})

test('anexosController excluir responde 404 quando o anexo some entre a checagem e a transação', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalBuscar = anexoModel.buscarPorId
  const originalBuscarAtualizacao = anexoModel.buscarPorIdParaAtualizacao
  const originalRemover = anexoService.remover
  let revertido = false

  anexoModel.buscarPorId = async () => ({ id: 9, public_id: 'abc' })
  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    rollback: async () => {
      revertido = true
    },
  })
  anexoModel.buscarPorIdParaAtualizacao = async () => null
  anexoService.remover = async () => {}

  try {
    await anexosController.excluir(
      { params: { id: '5', anexoId: '9' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 404)
    assert.equal(revertido, true)
  } finally {
    pool.getConnection = originalPool
    anexoModel.buscarPorId = originalBuscar
    anexoModel.buscarPorIdParaAtualizacao = originalBuscarAtualizacao
    anexoService.remover = originalRemover
  }
})

test('anexosController excluir responde 502 quando o armazenamento falha', async () => {
  const response = criarResposta()
  const originalBuscar = anexoModel.buscarPorId
  const originalRemover = anexoService.remover
  const originalConsoleError = console.error

  anexoModel.buscarPorId = async () => ({ id: 9, public_id: 'abc' })
  anexoService.remover = async () => {
    throw new Error('falha de rede')
  }
  console.error = () => {}

  try {
    await anexosController.excluir(
      { params: { id: '5', anexoId: '9' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 502)
  } finally {
    anexoModel.buscarPorId = originalBuscar
    anexoService.remover = originalRemover
    console.error = originalConsoleError
  }
})

test('anexosController excluir responde 500 quando o banco falha na transação', async () => {
  const response = criarResposta()
  const originalPool = pool.getConnection
  const originalBuscar = anexoModel.buscarPorId
  const originalBuscarAtualizacao = anexoModel.buscarPorIdParaAtualizacao
  const originalRemover = anexoService.remover
  const originalConsoleError = console.error
  let revertido = false

  anexoModel.buscarPorId = async () => ({ id: 9, public_id: 'abc' })
  pool.getConnection = async () => ({
    ...criarConexaoFake(),
    rollback: async () => {
      revertido = true
    },
  })
  anexoModel.buscarPorIdParaAtualizacao = async () => {
    throw new Error('falha do banco')
  }
  anexoService.remover = async () => {}
  console.error = () => {}

  try {
    await anexosController.excluir(
      { params: { id: '5', anexoId: '9' }, usuario: { id: 1 } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível excluir o anexo.',
    })
    assert.equal(revertido, true)
  } finally {
    pool.getConnection = originalPool
    anexoModel.buscarPorId = originalBuscar
    anexoModel.buscarPorIdParaAtualizacao = originalBuscarAtualizacao
    anexoService.remover = originalRemover
    console.error = originalConsoleError
  }
})
