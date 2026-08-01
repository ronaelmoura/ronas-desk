import assert from 'node:assert/strict'
import test from 'node:test'
import { criarApp } from '../src/app.js'

async function comServidor(app, callback) {
  const server = await new Promise((resolve, reject) => {
    const servidor = app.listen(0, '127.0.0.1', () => resolve(servidor))
    servidor.once('error', reject)
  })
  const endereco = server.address()
  const baseUrl = `http://127.0.0.1:${endereco.port}`

  try {
    await callback(baseUrl)
  } finally {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  }
}

test('healthcheck saudável retorna somente o estado público necessário', async () => {
  const database = {
    async query(sql) {
      assert.equal(sql, 'SELECT 1')
    },
  }
  const app = criarApp({ database, variaveis: { NODE_ENV: 'test' } })

  await comServidor(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok' })
  })
})

test('healthcheck indisponível não expõe detalhes internos', async () => {
  const database = {
    async query() {
      const error = new Error('detalhe interno do banco')
      error.code = 'ER_TESTE_INTERNO'
      throw error
    },
  }
  const app = criarApp({ database, variaveis: { NODE_ENV: 'test' } })
  const consoleErrorOriginal = console.error
  const logs = []
  console.error = (...args) => logs.push(args)

  try {
    await comServidor(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`)
      const body = await response.json()

      assert.equal(response.status, 503)
      assert.deepEqual(body, {
        status: 'indisponivel',
        message: 'Serviço temporariamente indisponível.',
      })
      assert.equal(JSON.stringify(body).includes('ER_TESTE_INTERNO'), false)
      assert.equal(JSON.stringify(body).includes('detalhe interno'), false)
    })
  } finally {
    console.error = consoleErrorOriginal
  }

  assert.equal(logs[0][1], 'ER_TESTE_INTERNO')
})

test('Helmet adiciona headers de segurança e remove identificação do Express', async () => {
  const database = { query: async () => {} }
  const app = criarApp({ database, variaveis: { NODE_ENV: 'test' } })

  await comServidor(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`)

    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.headers.get('x-powered-by'), null)
    assert.match(response.headers.get('content-security-policy'), /default-src/)
  })
})

test('login bloqueia novas tentativas após atingir o limite configurado', async () => {
  const database = { query: async () => {} }
  const app = criarApp({
    database,
    variaveis: {
      NODE_ENV: 'test',
      LOGIN_RATE_LIMIT_MAX: '2',
      LOGIN_RATE_LIMIT_WINDOW_MS: '60000',
    },
  })

  await comServidor(app, async (baseUrl) => {
    const tentarLogin = () =>
      fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: '', senha: '' }),
      })

    assert.equal((await tentarLogin()).status, 400)
    assert.equal((await tentarLogin()).status, 400)

    const responseBloqueada = await tentarLogin()

    assert.equal(responseBloqueada.status, 429)
    assert.deepEqual(await responseBloqueada.json(), {
      status: 'erro',
      message: 'Muitas tentativas de acesso. Tente novamente mais tarde.',
    })
  })
})
