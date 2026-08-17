import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import test from 'node:test'

import authMiddleware from '../src/middlewares/authMiddleware.js'

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

test('authMiddleware rejeita requisição sem Authorization', () => {
  const response = criarResposta()
  const request = { headers: {} }
  let proximoFoiChamado = false

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita header Bearer malformado', () => {
  const response = criarResposta()
  const request = { headers: { authorization: 'Token abc123' } }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita token inválido', () => {
  const response = criarResposta()
  const request = {
    headers: { authorization: 'Bearer token-nao-valido' },
  }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita token expirado', () => {
  const response = criarResposta()
  const tokenExpirado = jwt.sign(
    { id: 7, exp: Math.floor(Date.now() / 1000) - 5 },
    'segredo-teste',
    { algorithm: 'HS256' },
  )
  const request = {
    headers: { authorization: `Bearer ${tokenExpirado}` },
  }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita assinatura com segredo incorreto', () => {
  const response = criarResposta()
  const tokenDoOutroSegredo = jwt.sign(
    { id: 11, nome: 'Outro', email: 'outro@example.com' },
    'segredo-errado',
    { algorithm: 'HS256' },
  )
  const request = {
    headers: { authorization: `Bearer ${tokenDoOutroSegredo}` },
  }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita payload sem ID válido', () => {
  const response = criarResposta()
  const tokenSemId = jwt.sign(
    { nome: 'Usuário inválido', email: 'invalido@example.com' },
    'segredo-teste',
    { algorithm: 'HS256' },
  )
  const request = {
    headers: { authorization: `Bearer ${tokenSemId}` },
  }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})

test('authMiddleware rejeita ID zero ou negativo no payload', () => {
  const response = criarResposta()
  const tokenComIdZero = jwt.sign(
    { id: 0, nome: 'Zero', email: 'zero@example.com' },
    'segredo-teste',
    { algorithm: 'HS256' },
  )
  const tokenComIdNegativo = jwt.sign(
    { id: -3, nome: 'Negativo', email: 'negativo@example.com' },
    'segredo-teste',
    { algorithm: 'HS256' },
  )
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(
    { headers: { authorization: `Bearer ${tokenComIdZero}` } },
    response,
    () => {
      proximoFoiChamado = true
    },
  )

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)

  authMiddleware(
    { headers: { authorization: `Bearer ${tokenComIdNegativo}` } },
    response,
    () => {
      proximoFoiChamado = true
    },
  )

  assert.equal(proximoFoiChamado, false)
  assert.equal(response.statusCode, 401)
})

test('authMiddleware aceita token válido e preenche request.usuario', () => {
  const response = criarResposta()
  const tokenValido = jwt.sign(
    {
      id: 9,
      nome: 'Maria Souza',
      email: 'maria@example.com',
      cargo: 'Atendente',
      cliente_id: 12,
    },
    'segredo-teste',
    { algorithm: 'HS256' },
  )
  const request = {
    headers: { authorization: `Bearer ${tokenValido}` },
  }
  let proximoFoiChamado = false

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    proximoFoiChamado = true
  })

  assert.equal(proximoFoiChamado, true)
  assert.equal(response.statusCode, null)
  assert.deepEqual(request.usuario, {
    id: 9,
    nome: 'Maria Souza',
    email: 'maria@example.com',
    cargo: 'Atendente',
    cliente_id: 12,
  })
})

test('authMiddleware rejeita algoritmo JWT inesperado', () => {
  const response = criarResposta()
  const tokenHs512 = jwt.sign(
    { id: 4, nome: 'Teste', email: 'teste@example.com' },
    'segredo-teste',
    { algorithm: 'HS512' },
  )
  const request = {
    headers: { authorization: `Bearer ${tokenHs512}` },
  }

  process.env.JWT_SECRET = 'segredo-teste'

  authMiddleware(request, response, () => {
    throw new Error('next não deveria ser chamado')
  })

  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, {
    status: 'erro',
    message: 'Token ausente, inválido ou expirado.',
  })
})
