// Testes de integração do fluxo de autenticação contra um MySQL real.
//
// Ao contrário de backend/test/authController.test.js (que usa mocks), aqui
// o login roda de ponta a ponta: bcrypt real, consulta real em `usuarios`,
// emissão real de JWT. O objetivo é pegar bugs que só aparecem na integração
// entre a query SQL, o schema de verdade e a lógica do controller — algo que
// um mock nunca vai detectar.
import assert from 'node:assert/strict'
import test, { afterEach, after } from 'node:test'
import jwt from 'jsonwebtoken'
import {
  limparBanco,
  fecharPool,
  criarUsuario,
  subirServidor,
  login,
} from './helpers.js'

afterEach(limparBanco)
after(fecharPool)

test('login com credenciais corretas retorna token válido e dados públicos do usuário', async () => {
  const usuario = await criarUsuario({
    nome: 'Ana Souza',
    email: 'ana.integracao@example.com',
    senha: 'senha-correta-123',
    cargo: 'Atendente',
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const { status, body } = await login(
      baseUrl,
      'ana.integracao@example.com',
      'senha-correta-123',
    )

    assert.equal(status, 200)
    assert.equal(typeof body.token, 'string')
    assert.deepEqual(body.usuario, {
      id: usuario.id,
      nome: 'Ana Souza',
      email: 'ana.integracao@example.com',
      cargo: 'Atendente',
      cliente_id: null,
      is_demo: false,
    })

    const payload = jwt.verify(body.token, process.env.JWT_SECRET)
    assert.equal(payload.id, usuario.id)
  } finally {
    await fechar()
  }
})

test('login com senha errada retorna 401 sem revelar se o email existe', async () => {
  await criarUsuario({
    email: 'bruno.integracao@example.com',
    senha: 'senha-correta-123',
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const comSenhaErrada = await login(
      baseUrl,
      'bruno.integracao@example.com',
      'senha-errada',
    )
    const comEmailInexistente = await login(
      baseUrl,
      'nao-existe@example.com',
      'qualquer-coisa',
    )

    assert.equal(comSenhaErrada.status, 401)
    assert.equal(comEmailInexistente.status, 401)
    assert.equal(comSenhaErrada.body.message, comEmailInexistente.body.message)
  } finally {
    await fechar()
  }
})

test('login de usuário inativo é rejeitado mesmo com a senha correta', async () => {
  await criarUsuario({
    email: 'carla.integracao@example.com',
    senha: 'senha-correta-123',
    ativo: false,
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const { status, body } = await login(
      baseUrl,
      'carla.integracao@example.com',
      'senha-correta-123',
    )

    assert.equal(status, 401)
    assert.match(body.message, /inválid/i)
  } finally {
    await fechar()
  }
})

test('GET /api/auth/me exige um token válido e retorna o usuário autenticado', async () => {
  const usuario = await criarUsuario({
    nome: 'Diego Alves',
    email: 'diego.integracao@example.com',
    senha: 'senha-correta-123',
    cargo: 'Administrador',
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const semToken = await fetch(`${baseUrl}/api/auth/me`)
    assert.equal(semToken.status, 401)

    const { body: loginBody } = await login(
      baseUrl,
      'diego.integracao@example.com',
      'senha-correta-123',
    )
    const comToken = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    })
    const corpo = await comToken.json()

    assert.equal(comToken.status, 200)
    assert.equal(corpo.id, usuario.id)
    assert.equal(corpo.email, 'diego.integracao@example.com')
  } finally {
    await fechar()
  }
})
