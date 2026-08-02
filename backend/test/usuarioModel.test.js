import assert from 'node:assert/strict'
import test from 'node:test'
import usuarioModel from '../src/models/usuarioModel.js'

test('redefine senha por email somente para usuário ativo', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }

  const atualizado = await usuarioModel.atualizarSenhaPorEmail(
    'admin@example.com',
    'hash-seguro',
    executor,
  )

  assert.equal(atualizado, true)
  assert.match(chamadas[0].sql, /UPDATE usuarios/)
  assert.match(chamadas[0].sql, /email = \?/)
  assert.match(chamadas[0].sql, /ativo = 1/)
  assert.deepEqual(chamadas[0].parametros, ['hash-seguro', 'admin@example.com'])
})

test('atualiza o próprio perfil com consulta parametrizada', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })

      if (/UPDATE usuarios/.test(sql)) {
        return [{ affectedRows: 1 }, []]
      }

      return [
        [
          {
            id: 5,
            nome: 'Nome Atualizado',
            email: 'novo@example.com',
            cargo: 'Atendente',
            ativo: 1,
          },
        ],
        [],
      ]
    },
  }

  const usuario = await usuarioModel.atualizarPerfil(
    5,
    { nome: 'Nome Atualizado', email: 'novo@example.com' },
    executor,
  )

  assert.match(chamadas[0].sql, /SET nome = \?, email = \?/)
  assert.match(chamadas[0].sql, /AND ativo = 1/)
  assert.deepEqual(chamadas[0].parametros, [
    'Nome Atualizado',
    'novo@example.com',
    5,
  ])
  assert.equal(usuario.ativo, true)
})

test('busca hash da senha somente pelo id parametrizado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [
        [
          {
            id: 5,
            nome: 'Nome Atualizado',
            email: 'novo@example.com',
            senha_hash: 'hash-atual',
            cargo: 'Atendente',
            ativo: 1,
          },
        ],
        [],
      ]
    },
  }

  const usuario = await usuarioModel.buscarPorIdComSenha(5, executor)

  assert.match(chamadas[0].sql, /senha_hash/)
  assert.match(chamadas[0].sql, /WHERE id = \?/)
  assert.deepEqual(chamadas[0].parametros, [5])
  assert.equal(usuario.senha_hash, 'hash-atual')
  assert.equal(usuario.ativo, true)
})

test('altera a própria senha por id somente para usuário ativo', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }

  const atualizado = await usuarioModel.atualizarSenhaPorId(
    8,
    'novo-hash',
    executor,
  )

  assert.equal(atualizado, true)
  assert.match(chamadas[0].sql, /WHERE id = \?/)
  assert.match(chamadas[0].sql, /AND ativo = 1/)
  assert.deepEqual(chamadas[0].parametros, ['novo-hash', 8])
})
