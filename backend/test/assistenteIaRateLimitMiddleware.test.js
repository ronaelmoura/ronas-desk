import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import { criarLimitadorAssistenteIa } from '../src/middlewares/assistenteIaRateLimitMiddleware.js'

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

test('limita resumos por usuário sem bloquear outro atendente', async () => {
  const app = express()
  app.use((request, _response, next) => {
    request.usuario = { id: Number(request.headers['x-usuario-id']) }
    next()
  })
  app.use(criarLimitadorAssistenteIa({ windowMs: 60_000, limit: 2 }))
  app.post('/', (_request, response) => response.sendStatus(200))

  await comServidor(app, async (baseUrl) => {
    const requisitar = (id) =>
      fetch(baseUrl, {
        method: 'POST',
        headers: { 'x-usuario-id': String(id) },
      })

    assert.equal((await requisitar(1)).status, 200)
    assert.equal((await requisitar(1)).status, 200)
    assert.equal((await requisitar(1)).status, 429)
    assert.equal((await requisitar(2)).status, 200)
  })
})
