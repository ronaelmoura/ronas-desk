import assert from 'node:assert/strict'
import test from 'node:test'
import { criarAuthController } from '../src/controllers/authController.js'

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

test('login continua emitindo token com dados públicos do usuário', async () => {
  const chamadas = []
  const controller = criarAuthController({
    usuarios: {
      buscarPorEmail: async () => ({
        id: 7,
        nome: 'Ronael Moura',
        email: 'ronael@example.com',
        senha_hash: 'hash-atual',
        cargo: 'Administrador',
        ativo: true,
      }),
    },
    criptografia: {
      compare: async (senha, hash) => {
        chamadas.push({ senha, hash })
        return true
      },
    },
    tokens: {
      sign: (payload, segredo, opcoes) => {
        chamadas.push({ payload, segredo, opcoes })
        return 'token-seguro'
      },
    },
    variaveis: { JWT_SECRET: 'segredo-de-teste', JWT_EXPIRES_IN: '1h' },
  })
  const response = criarResposta()

  await controller.login(
    { body: { email: ' RONAEL@example.com ', senha: 'senha-atual' } },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.token, 'token-seguro')
  assert.deepEqual(response.body.usuario, {
    id: 7,
    nome: 'Ronael Moura',
    email: 'ronael@example.com',
    cargo: 'Administrador',
  })
  assert.deepEqual(chamadas[0], {
    senha: 'senha-atual',
    hash: 'hash-atual',
  })
  assert.equal(chamadas[1].payload.senha_hash, undefined)
})

test('atualiza somente nome e email do próprio perfil', async () => {
  const chamadas = []
  const controller = criarAuthController({
    usuarios: {
      buscarPorId: async () => ({ id: 4, ativo: true }),
      buscarPorEmail: async () => ({ id: 4 }),
      atualizarPerfil: async (id, dados) => {
        chamadas.push({ id, dados })
        return {
          id,
          ...dados,
          cargo: 'Atendente',
          ativo: true,
        }
      },
    },
  })
  const response = criarResposta()

  await controller.atualizarPerfil(
    {
      usuario: { id: 4 },
      body: {
        nome: '  Novo Nome  ',
        email: ' NOVO@EXAMPLE.COM ',
        cargo: 'Administrador',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.deepEqual(chamadas, [
    {
      id: 4,
      dados: { nome: 'Novo Nome', email: 'novo@example.com' },
    },
  ])
  assert.equal(response.body.cargo, 'Atendente')
})

test('impede que o próprio perfil use email de outro usuário', async () => {
  let atualizou = false
  const controller = criarAuthController({
    usuarios: {
      buscarPorId: async () => ({ id: 4, ativo: true }),
      buscarPorEmail: async () => ({ id: 9 }),
      atualizarPerfil: async () => {
        atualizou = true
      },
    },
  })
  const response = criarResposta()

  await controller.atualizarPerfil(
    {
      usuario: { id: 4 },
      body: { nome: 'Ronael Moura', email: 'usado@example.com' },
    },
    response,
  )

  assert.equal(response.statusCode, 409)
  assert.equal(atualizou, false)
})

test('não altera senha quando a senha atual está incorreta', async () => {
  let gerouHash = false
  let atualizou = false
  const controller = criarAuthController({
    usuarios: {
      buscarPorIdComSenha: async () => ({
        id: 3,
        senha_hash: 'hash-atual',
        ativo: true,
      }),
      atualizarSenhaPorId: async () => {
        atualizou = true
      },
    },
    criptografia: {
      compare: async () => false,
      hash: async () => {
        gerouHash = true
      },
    },
  })
  const response = criarResposta()

  await controller.alterarSenha(
    {
      usuario: { id: 3 },
      body: {
        senhaAtual: 'senha-incorreta',
        novaSenha: 'nova-senha-segura',
        confirmarNovaSenha: 'nova-senha-segura',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.message, 'Senha atual incorreta.')
  assert.equal(gerouHash, false)
  assert.equal(atualizou, false)
})

test('altera senha confirmada usando bcrypt com custo 12', async () => {
  const chamadas = []
  const controller = criarAuthController({
    usuarios: {
      buscarPorIdComSenha: async () => ({
        id: 3,
        senha_hash: 'hash-atual',
        ativo: true,
      }),
      atualizarSenhaPorId: async (id, hash) => {
        chamadas.push({ id, hash })
        return true
      },
    },
    criptografia: {
      compare: async (senha, hash) => {
        chamadas.push({ senha, hash })
        return true
      },
      hash: async (senha, custo) => {
        chamadas.push({ senha, custo })
        return 'novo-hash'
      },
    },
  })
  const response = criarResposta()

  await controller.alterarSenha(
    {
      usuario: { id: 3 },
      body: {
        senhaAtual: 'senha-atual',
        novaSenha: 'nova-senha-segura',
        confirmarNovaSenha: 'nova-senha-segura',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.message, 'Senha atualizada com sucesso.')
  assert.deepEqual(chamadas, [
    { senha: 'senha-atual', hash: 'hash-atual' },
    { senha: 'nova-senha-segura', custo: 12 },
    { id: 3, hash: 'novo-hash' },
  ])
})

test('rejeita confirmação de nova senha diferente', async () => {
  let consultouUsuario = false
  const controller = criarAuthController({
    usuarios: {
      buscarPorIdComSenha: async () => {
        consultouUsuario = true
      },
    },
  })
  const response = criarResposta()

  await controller.alterarSenha(
    {
      usuario: { id: 3 },
      body: {
        senhaAtual: 'senha-atual',
        novaSenha: 'nova-senha-segura',
        confirmarNovaSenha: 'outra-senha-segura',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.equal(
    response.body.message,
    'A confirmação da nova senha não confere.',
  )
  assert.equal(consultouUsuario, false)
})
