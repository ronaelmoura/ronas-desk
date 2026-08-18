import assert from 'node:assert/strict'
import test from 'node:test'
import { criarVisitasController } from '../src/controllers/visitasController.js'

function criarResponse() {
  return {
    statusCode: 200,
    body: null,
    finalizada: false,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    end() {
      this.finalizada = true
      return this
    },
  }
}

test('rejeita identificador ou página inválidos', async () => {
  const controller = criarVisitasController()
  const response = criarResponse()

  await controller.registrar(
    { body: { sessao_id: 'curta', pagina: 'segredo' } },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.status, 'erro')
})

test('registra visita sem persistir o identificador ou IP recebidos', async () => {
  let visitaRegistrada
  let ipConsultado
  const controller = criarVisitasController({
    visitas: {
      async buscarLocalizacaoDaSessao() {
        return null
      },
      async registrar(visita) {
        visitaRegistrada = visita
      },
    },
    geolocalizacao: {
      async localizarIp(ip) {
        ipConsultado = ip
        return { pais: 'Brasil', regiao: 'Rio de Janeiro' }
      },
    },
  })
  const response = criarResponse()
  const sessaoId = '550e8400-e29b-41d4-a716-446655440000'

  await controller.registrar(
    {
      body: {
        sessao_id: sessaoId,
        pagina: 'visao-geral',
        origem: 'https://www.linkedin.com/feed/',
      },
      ip: '203.0.113.10',
      headers: {},
      app: { get: () => false },
      get(nome) {
        return nome === 'user-agent'
          ? 'Mozilla/5.0 (Linux; Android 14; Mobile)'
          : undefined
      },
    },
    response,
  )

  assert.equal(response.statusCode, 204)
  assert.equal(response.finalizada, true)
  assert.equal(ipConsultado, '203.0.113.10')
  assert.notEqual(visitaRegistrada.sessao_hash, sessaoId)
  assert.equal(visitaRegistrada.sessao_hash.length, 64)
  assert.equal(visitaRegistrada.origem, 'www.linkedin.com')
  assert.equal(visitaRegistrada.dispositivo, 'Celular')
  assert.equal('ip' in visitaRegistrada, false)
})

test('reutiliza localização da sessão sem consultar novamente o IP', async () => {
  let consultas = 0
  let visitaRegistrada
  const controller = criarVisitasController({
    visitas: {
      async buscarLocalizacaoDaSessao() {
        return { pais: 'Brasil', regiao: 'São Paulo' }
      },
      async registrar(visita) {
        visitaRegistrada = visita
      },
    },
    geolocalizacao: {
      async localizarIp() {
        consultas += 1
      },
    },
  })
  const response = criarResponse()

  await controller.registrar(
    {
      body: {
        sessao_id: '550e8400-e29b-41d4-a716-446655440000',
        pagina: 'clientes',
      },
      ip: '203.0.113.10',
      get() {
        return 'Mozilla/5.0 (Windows NT 10.0)'
      },
    },
    response,
  )

  assert.equal(consultas, 0)
  assert.equal(visitaRegistrada.regiao, 'São Paulo')
  assert.equal(visitaRegistrada.dispositivo, 'Computador')
})

test('buscarResumo retorna estatísticas com sucesso', async () => {
  const controller = criarVisitasController({
    visitas: {
      async buscarResumo() {
        return {
          total_visitas: 150,
          paginas_mais_visitadas: [
            { pagina: 'visao-geral', visitas: 50 },
            { pagina: 'chamados', visitas: 40 },
          ],
          dispositivos: [
            { dispositivo: 'Computador', visitas: 100 },
            { dispositivo: 'Celular', visitas: 50 },
          ],
        }
      },
    },
  })
  const response = criarResponse()

  await controller.buscarResumo(
    {
      query: {
        data_inicio: '2025-01-01',
        data_fim: '2025-01-31',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.total_visitas, 150)
})

test('buscarResumo responde 400 com período inválido', async () => {
  const controller = criarVisitasController()
  const response = criarResponse()

  await controller.buscarResumo(
    {
      query: {
        data_inicio: '2025-13-01',
        data_fim: '2025-01-01',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.status, 'erro')
})

test('buscarResumo responde 500 quando banco falha', async () => {
  const controller = criarVisitasController({
    visitas: {
      async buscarResumo() {
        throw new Error('falha do banco')
      },
    },
  })
  const response = criarResponse()
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    await controller.buscarResumo(
      {
        query: {
          data_inicio: '2025-01-01',
          data_fim: '2025-01-31',
        },
      },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.equal(response.body.status, 'erro')
  } finally {
    console.error = originalConsoleError
  }
})
