import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import test from 'node:test'
import { criarApp } from '../src/app.js'
import usuarioModel from '../src/models/usuarioModel.js'

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
    assert.match(
      response.headers.get('content-security-policy'),
      /img-src 'self' data: https:/,
    )
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

test('requisição sem autenticação em rota protegida retorna 401', async () => {
  const app = criarApp({
    database: { query: async () => {} },
    variaveis: { NODE_ENV: 'test', JWT_SECRET: 'segredo-teste' },
  })

  await comServidor(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/chamados`)

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), {
      status: 'erro',
      message: 'Token ausente, inválido ou expirado.',
    })
  })
})

test('usuário autenticado sem autorização para equipe recebe 403', async () => {
  const originalBuscarPorId = usuarioModel.buscarPorId
  const originalJwtSecret = process.env.JWT_SECRET

  usuarioModel.buscarPorId = async () => ({
    id: 3,
    nome: 'Cliente',
    email: 'cliente@example.com',
    cargo: 'Cliente',
    ativo: true,
    is_demo: false,
  })
  process.env.JWT_SECRET = 'segredo-teste'

  const app = criarApp({
    database: { query: async () => {} },
    variaveis: { NODE_ENV: 'test', JWT_SECRET: 'segredo-teste' },
  })
  const token = jwt.sign({ id: 3, cargo: 'Cliente' }, 'segredo-teste', {
    algorithm: 'HS256',
  })

  try {
    await comServidor(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/chamados`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      assert.equal(response.status, 403)
      assert.deepEqual(await response.json(), {
        status: 'erro',
        message: 'Esta área é exclusiva para a equipe de atendimento.',
      })
    })
  } finally {
    usuarioModel.buscarPorId = originalBuscarPorId
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = originalJwtSecret
    }
  }
})

test('payload inválido em rota de login retorna 400', async () => {
  const app = criarApp({
    database: { query: async () => {} },
    variaveis: { NODE_ENV: 'test', JWT_SECRET: 'segredo-teste' },
  })

  await comServidor(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'teste@example.com' }),
    })

    assert.equal(response.status, 400)
    assert.match(JSON.stringify(await response.json()), /senha/i)
  })
})

test('rota inexistente retorna 404', async () => {
  const app = criarApp({
    database: { query: async () => {} },
    variaveis: { NODE_ENV: 'test', JWT_SECRET: 'segredo-teste' },
  })

  await comServidor(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rota-que-nao-existe`)

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), {
      status: 'erro',
      message: 'Rota não encontrada.',
    })
  })
})
