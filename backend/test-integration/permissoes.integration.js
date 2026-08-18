// Testes de integração de autorização contra um MySQL real.
//
// O ADR 0004 (docs/adr/0004-autorizacao-por-middlewares.md) documenta que a
// autorização revalida o usuário no banco a cada requisição, em vez de
// confiar apenas nas claims do JWT. Isso só pode ser provado de verdade
// batendo em um banco real: os testes unitários mockam o executor e não
// pegariam, por exemplo, uma query de permissão com o WHERE errado.
import assert from 'node:assert/strict'
import test, { afterEach, after } from 'node:test'
import {
  limparBanco,
  fecharPool,
  criarUsuario,
  criarCliente,
  subirServidor,
  login,
} from './helpers.js'

afterEach(limparBanco)
after(fecharPool)

async function autenticar(baseUrl, email, senha) {
  const { body } = await login(baseUrl, email, senha)
  return body.token
}

test('POST /api/usuarios: apenas Administrador ativo pode criar usuário', async () => {
  const senha = 'senha-correta-123'
  await criarUsuario({
    email: 'admin@example.com',
    senha,
    cargo: 'Administrador',
  })
  await criarUsuario({
    email: 'atendente@example.com',
    senha,
    cargo: 'Atendente',
  })
  const cliente = await criarCliente({ email: 'cliente-empresa@example.com' })
  await criarUsuario({
    email: 'cliente@example.com',
    senha,
    cargo: 'Cliente',
    cliente_id: cliente.id,
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const payload = {
      nome: 'Novo Usuário',
      email: 'novo@example.com',
      senha: 'senha-nova-123',
      cargo: 'Atendente',
    }
    const criarComToken = async (token) =>
      fetch(`${baseUrl}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

    const tokenAdmin = await autenticar(baseUrl, 'admin@example.com', senha)
    const respostaAdmin = await criarComToken(tokenAdmin)
    assert.equal(respostaAdmin.status, 201)

    const tokenAtendente = await autenticar(
      baseUrl,
      'atendente@example.com',
      senha,
    )
    const respostaAtendente = await criarComToken(tokenAtendente)
    assert.equal(respostaAtendente.status, 403)

    const tokenCliente = await autenticar(baseUrl, 'cliente@example.com', senha)
    const respostaCliente = await criarComToken(tokenCliente)
    assert.equal(respostaCliente.status, 403)
  } finally {
    await fechar()
  }
})

test('GET /api/dashboard: exclusivo para a equipe de atendimento, não para clientes', async () => {
  const senha = 'senha-correta-123'
  await criarUsuario({
    email: 'admin2@example.com',
    senha,
    cargo: 'Administrador',
  })
  const cliente = await criarCliente({ email: 'cliente-empresa2@example.com' })
  await criarUsuario({
    email: 'cliente2@example.com',
    senha,
    cargo: 'Cliente',
    cliente_id: cliente.id,
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const tokenAdmin = await autenticar(baseUrl, 'admin2@example.com', senha)
    const respostaAdmin = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
    assert.equal(respostaAdmin.status, 200)

    const tokenCliente = await autenticar(
      baseUrl,
      'cliente2@example.com',
      senha,
    )
    const respostaCliente = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${tokenCliente}` },
    })
    assert.equal(respostaCliente.status, 403)
  } finally {
    await fechar()
  }
})

test('GET /api/portal/chamados: exige cargo Cliente com cadastro de cliente ativo vinculado', async () => {
  const senha = 'senha-correta-123'
  const clienteAtivo = await criarCliente({
    email: 'ativo@example.com',
    ativo: true,
  })
  const clienteInativo = await criarCliente({
    email: 'inativo@example.com',
    ativo: false,
  })
  await criarUsuario({
    email: 'cliente-ativo@example.com',
    senha,
    cargo: 'Cliente',
    cliente_id: clienteAtivo.id,
  })
  await criarUsuario({
    email: 'cliente-sem-vinculo@example.com',
    senha,
    cargo: 'Cliente',
    cliente_id: null,
  })
  await criarUsuario({
    email: 'cliente-inativo@example.com',
    senha,
    cargo: 'Cliente',
    cliente_id: clienteInativo.id,
  })
  await criarUsuario({
    email: 'atendente2@example.com',
    senha,
    cargo: 'Atendente',
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const acessarPortal = async (email) => {
      const token = await autenticar(baseUrl, email, senha)
      return fetch(`${baseUrl}/api/portal/chamados`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    assert.equal((await acessarPortal('cliente-ativo@example.com')).status, 200)
    assert.equal(
      (await acessarPortal('cliente-sem-vinculo@example.com')).status,
      403,
    )
    assert.equal(
      (await acessarPortal('cliente-inativo@example.com')).status,
      403,
    )
    assert.equal((await acessarPortal('atendente2@example.com')).status, 403)
  } finally {
    await fechar()
  }
})

test('conta de demonstração não pode alterar o próprio perfil (somente leitura)', async () => {
  const senha = 'senha-correta-123'
  await criarUsuario({
    email: 'demo@example.com',
    senha,
    cargo: 'Administrador',
    is_demo: true,
  })
  const { baseUrl, fechar } = await subirServidor()

  try {
    const token = await autenticar(baseUrl, 'demo@example.com', senha)
    const resposta = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nome: 'Novo Nome', email: 'demo@example.com' }),
    })

    assert.equal(resposta.status, 403)
  } finally {
    await fechar()
  }
})
