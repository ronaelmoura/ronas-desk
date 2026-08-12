import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import { criarLimitadorLogin } from '../src/middlewares/loginRateLimitMiddleware.js'

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

test('limitador da demonstração contabiliza respostas bem-sucedidas', async () => {
  const app = express()
  app.use(
    criarLimitadorLogin(
      { windowMs: 60_000, limit: 2 },
      { ignorarSucessos: false },
    ),
  )
  app.post('/', (request, response) => response.sendStatus(200))

  await comServidor(app, async (baseUrl) => {
    assert.equal((await fetch(baseUrl, { method: 'POST' })).status, 200)
    assert.equal((await fetch(baseUrl, { method: 'POST' })).status, 200)
    assert.equal((await fetch(baseUrl, { method: 'POST' })).status, 429)
  })
})
