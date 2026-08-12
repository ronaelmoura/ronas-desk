import assert from 'node:assert/strict'
import test from 'node:test'
import { criarDemoReadOnlyMiddleware } from '../src/middlewares/demoReadOnlyMiddleware.js'

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

test('conta demo pode consultar dados', async () => {
  let consultouUsuario = false
  let continuou = false
  const middleware = criarDemoReadOnlyMiddleware({
    usuarios: {
      buscarPorId: async () => {
        consultouUsuario = true
      },
    },
  })

  await middleware(
    { method: 'GET', usuario: { id: 5 } },
    criarResposta(),
    () => {
      continuou = true
    },
  )

  assert.equal(continuou, true)
  assert.equal(consultouUsuario, false)
})

test('conta demo não pode alterar dados', async () => {
  let continuou = false
  const middleware = criarDemoReadOnlyMiddleware({
    usuarios: {
      buscarPorId: async (id) => ({ id, ativo: true, is_demo: true }),
    },
  })
  const response = criarResposta()

  await middleware({ method: 'POST', usuario: { id: 5 } }, response, () => {
    continuou = true
  })

  assert.equal(continuou, false)
  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, {
    status: 'erro',
    code: 'DEMO_READ_ONLY',
    message: 'A conta de demonstração permite apenas visualizar os dados.',
  })
})

test('conta comum continua podendo alterar dados', async () => {
  let continuou = false
  const middleware = criarDemoReadOnlyMiddleware({
    usuarios: {
      buscarPorId: async (id) => ({ id, ativo: true, is_demo: false }),
    },
  })

  await middleware(
    { method: 'DELETE', usuario: { id: 2 } },
    criarResposta(),
    () => {
      continuou = true
    },
  )

  assert.equal(continuou, true)
})
