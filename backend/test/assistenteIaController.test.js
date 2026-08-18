import assert from 'node:assert/strict'
import test from 'node:test'

import assistenteIaController from '../src/controllers/assistenteIaController.js'
import chamadoModel from '../src/models/chamadoModel.js'
import comentarioModel from '../src/models/comentarioModel.js'
import historyService from '../src/services/historyService.js'
import assistenteIaService, {
  AssistenteIaErroError,
  AssistenteIaIndisponivelError,
} from '../src/services/assistenteIaService.js'

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

test('assistenteIaController gerarResumo rejeita id inválido', async () => {
  const response = criarResposta()

  await assistenteIaController.gerarResumo({ params: { id: '0' } }, response)

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { status: 'erro', message: 'ID inválido.' })
})

test('assistenteIaController gerarResumo responde 404 quando chamado não existe', async () => {
  const response = criarResposta()
  const original = chamadoModel.buscarPorId

  chamadoModel.buscarPorId = async () => null

  try {
    await assistenteIaController.gerarResumo({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  } finally {
    chamadoModel.buscarPorId = original
  }
})

test('assistenteIaController gerarResumo retorna resumo com sucesso', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalComentarios = comentarioModel.listarPorChamado
  const originalHistorico = historyService.listarPorChamado
  const originalGerar = assistenteIaService.gerarResumoChamado

  chamadoModel.buscarPorId = async () => ({ id: 5, titulo: 'Chamado teste' })
  comentarioModel.listarPorChamado = async () => [{ id: 1, conteudo: 'Olá' }]
  historyService.listarPorChamado = async () => [{ id: 1, acao: 'criado' }]
  assistenteIaService.gerarResumoChamado = async () => ({ resumo: 'Resumo gerado com sucesso' })

  try {
    await assistenteIaController.gerarResumo({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.resumo, 'Resumo gerado com sucesso')
  } finally {
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.listarPorChamado = originalComentarios
    historyService.listarPorChamado = originalHistorico
    assistenteIaService.gerarResumoChamado = originalGerar
  }
})

test('assistenteIaController gerarResumo responde 503 quando IA não está configurada', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalComentarios = comentarioModel.listarPorChamado
  const originalHistorico = historyService.listarPorChamado
  const originalGerar = assistenteIaService.gerarResumoChamado

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.listarPorChamado = async () => []
  historyService.listarPorChamado = async () => []
  assistenteIaService.gerarResumoChamado = async () => {
    throw new AssistenteIaIndisponivelError('não configurado')
  }

  try {
    await assistenteIaController.gerarResumo({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 503)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'O assistente de IA ainda não está configurado.',
    })
  } finally {
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.listarPorChamado = originalComentarios
    historyService.listarPorChamado = originalHistorico
    assistenteIaService.gerarResumoChamado = originalGerar
  }
})

test('assistenteIaController gerarResumo responde 502 quando o provedor de IA falha', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalComentarios = comentarioModel.listarPorChamado
  const originalHistorico = historyService.listarPorChamado
  const originalGerar = assistenteIaService.gerarResumoChamado
  const originalConsoleError = console.error

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.listarPorChamado = async () => []
  historyService.listarPorChamado = async () => []
  assistenteIaService.gerarResumoChamado = async () => {
    const erro = new AssistenteIaErroError('falha upstream')
    erro.codigoHttp = 429
    throw erro
  }
  console.error = () => {}

  try {
    await assistenteIaController.gerarResumo({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível gerar o resumo com IA. Tente novamente.',
    })
  } finally {
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.listarPorChamado = originalComentarios
    historyService.listarPorChamado = originalHistorico
    assistenteIaService.gerarResumoChamado = originalGerar
    console.error = originalConsoleError
  }
})

test('assistenteIaController gerarResumo responde 500 para erro inesperado', async () => {
  const response = criarResposta()
  const originalChamado = chamadoModel.buscarPorId
  const originalComentarios = comentarioModel.listarPorChamado
  const originalHistorico = historyService.listarPorChamado
  const originalGerar = assistenteIaService.gerarResumoChamado
  const originalConsoleError = console.error

  chamadoModel.buscarPorId = async () => ({ id: 5 })
  comentarioModel.listarPorChamado = async () => []
  historyService.listarPorChamado = async () => []
  assistenteIaService.gerarResumoChamado = async () => {
    throw new Error('falha inesperada')
  }
  console.error = () => {}

  try {
    await assistenteIaController.gerarResumo({ params: { id: '5' } }, response)

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível gerar o resumo com IA.',
    })
  } finally {
    chamadoModel.buscarPorId = originalChamado
    comentarioModel.listarPorChamado = originalComentarios
    historyService.listarPorChamado = originalHistorico
    assistenteIaService.gerarResumoChamado = originalGerar
    console.error = originalConsoleError
  }
})
