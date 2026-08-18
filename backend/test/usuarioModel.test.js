import assert from 'node:assert/strict'
import test from 'node:test'
import usuarioModel from '../src/models/usuarioModel.js'
import pool from '../src/database/db.js'

const usuarioLinha = {
  id: 9,
  nome: 'Ana Souza',
  email: 'ana@example.com',
  cargo: 'Atendente',
  cliente_id: null,
  ativo: 1,
  is_demo: 0,
  created_at: '2026-08-01',
  updated_at: '2026-08-01',
}

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

test('busca conta vinculada ao cliente com consulta parametrizada', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[], []]
    },
  }

  const usuario = await usuarioModel.buscarPorClienteId(12, executor)

  assert.equal(usuario, null)
  assert.match(chamadas[0].sql, /WHERE cliente_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [12])
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

test('listar retorna todos os usuários normalizados', async () => {
  const originalQuery = pool.query
  pool.query = async () => [[usuarioLinha], []]

  try {
    const usuarios = await usuarioModel.listar()

    assert.equal(usuarios.length, 1)
    assert.equal(usuarios[0].ativo, true)
    assert.equal(usuarios[0].is_demo, false)
  } finally {
    pool.query = originalQuery
  }
})

test('buscarDemoAtivo retorna o usuário demonstrativo normalizado', async () => {
  const originalQuery = pool.query
  pool.query = async () => [[usuarioLinha], []]

  try {
    const usuario = await usuarioModel.buscarDemoAtivo()

    assert.equal(usuario.id, 9)
    assert.equal(usuario.ativo, true)
  } finally {
    pool.query = originalQuery
  }
})

test('buscarDemoAtivo retorna null quando não há usuário demonstrativo', async () => {
  const originalQuery = pool.query
  pool.query = async () => [[], []]

  try {
    const usuario = await usuarioModel.buscarDemoAtivo()

    assert.equal(usuario, null)
  } finally {
    pool.query = originalQuery
  }
})

test('listarEquipeAtiva retorna administradores e atendentes ativos', async () => {
  const originalQuery = pool.query
  pool.query = async () => [[usuarioLinha], []]

  try {
    const equipe = await usuarioModel.listarEquipeAtiva()

    assert.equal(equipe.length, 1)
    assert.equal(equipe[0].nome, 'Ana Souza')
  } finally {
    pool.query = originalQuery
  }
})

test('buscarPorEmail retorna o usuário normalizado com o hash da senha', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    return [[{ ...usuarioLinha, senha_hash: 'hash' }], []]
  }

  try {
    const usuario = await usuarioModel.buscarPorEmail('ana@example.com')

    assert.equal(usuario.senha_hash, 'hash')
    assert.deepEqual(chamadas[0].parametros, ['ana@example.com'])
  } finally {
    pool.execute = originalExecute
  }
})

test('buscarPorEmail retorna null quando o email não existe', async () => {
  const originalExecute = pool.execute
  pool.execute = async () => [[], []]

  try {
    const usuario = await usuarioModel.buscarPorEmail('ninguem@example.com')

    assert.equal(usuario, null)
  } finally {
    pool.execute = originalExecute
  }
})

test('listarPaginado busca com filtro de texto e retorna total', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    if (/COUNT\(\*\)/.test(sql)) {
      return [[{ total: 1 }], []]
    }
    return [[usuarioLinha], []]
  }

  try {
    const resultado = await usuarioModel.listarPaginado(
      { busca: 'ana' },
      { limite: 10, offset: 0 },
    )

    assert.equal(resultado.total, 1)
    assert.equal(resultado.dados.length, 1)
    assert.match(chamadas[0].sql, /WHERE nome LIKE \? OR email LIKE \?/)
    assert.deepEqual(chamadas[0].parametros, ['%ana%', '%ana%'])
  } finally {
    pool.execute = originalExecute
  }
})

test('listarPaginado sem busca não aplica filtro de texto', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    if (/COUNT\(\*\)/.test(sql)) {
      return [[{ total: 0 }], []]
    }
    return [[], []]
  }

  try {
    const resultado = await usuarioModel.listarPaginado(
      {},
      { limite: 10, offset: 0 },
    )

    assert.equal(resultado.total, 0)
    assert.deepEqual(chamadas[0].parametros, [])
    assert.doesNotMatch(chamadas[0].sql, /WHERE/)
  } finally {
    pool.execute = originalExecute
  }
})

test('criar insere o usuário e retorna o registro recém-criado', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    if (/INSERT INTO usuarios/.test(sql)) {
      return [{ insertId: 9 }, []]
    }
    return [[usuarioLinha], []]
  }

  try {
    const usuario = await usuarioModel.criar({
      nome: 'Ana Souza',
      email: 'ana@example.com',
      senha_hash: 'hash',
      cargo: 'Atendente',
    })

    assert.equal(usuario.id, 9)
    assert.deepEqual(chamadas[0].parametros, [
      'Ana Souza',
      'ana@example.com',
      'hash',
      'Atendente',
      null,
      false,
    ])
  } finally {
    pool.execute = originalExecute
  }
})

test('atualizar troca a senha somente quando informada e retorna o usuário atualizado', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    if (/UPDATE usuarios/.test(sql)) {
      return [{ affectedRows: 1 }, []]
    }
    return [[usuarioLinha], []]
  }

  try {
    const usuario = await usuarioModel.atualizar(9, {
      nome: 'Ana Souza',
      email: 'ana@example.com',
      cargo: 'Atendente',
      senha_hash: 'novo-hash',
    })

    assert.equal(usuario.id, 9)
    assert.match(chamadas[0].sql, /senha_hash = \?/)
    assert.deepEqual(chamadas[0].parametros, [
      'Ana Souza',
      'ana@example.com',
      'Atendente',
      null,
      'novo-hash',
      9,
    ])
  } finally {
    pool.execute = originalExecute
  }
})

test('atualizar retorna null quando nenhum usuário é afetado', async () => {
  const originalExecute = pool.execute
  pool.execute = async () => [{ affectedRows: 0 }, []]

  try {
    const usuario = await usuarioModel.atualizar(999, {
      nome: 'X',
      email: 'x@example.com',
      cargo: 'Atendente',
    })

    assert.equal(usuario, null)
  } finally {
    pool.execute = originalExecute
  }
})

test('alterarStatus atualiza o campo ativo e retorna o usuário', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    if (/UPDATE usuarios/.test(sql)) {
      return [{ affectedRows: 1 }, []]
    }
    return [[usuarioLinha], []]
  }

  try {
    const usuario = await usuarioModel.alterarStatus(9, false)

    assert.equal(usuario.id, 9)
    assert.deepEqual(chamadas[0].parametros, [false, 9])
  } finally {
    pool.execute = originalExecute
  }
})

test('alterarStatus retorna null quando o usuário não existe', async () => {
  const originalExecute = pool.execute
  pool.execute = async () => [{ affectedRows: 0 }, []]

  try {
    const usuario = await usuarioModel.alterarStatus(999, false)

    assert.equal(usuario, null)
  } finally {
    pool.execute = originalExecute
  }
})

test('excluir remove o usuário e retorna verdadeiro quando afetado', async () => {
  const originalExecute = pool.execute
  const chamadas = []
  pool.execute = async (sql, parametros) => {
    chamadas.push({ sql, parametros })
    return [{ affectedRows: 1 }, []]
  }

  try {
    const excluido = await usuarioModel.excluir(9)

    assert.equal(excluido, true)
    assert.match(chamadas[0].sql, /DELETE FROM usuarios WHERE id = \?/)
    assert.deepEqual(chamadas[0].parametros, [9])
  } finally {
    pool.execute = originalExecute
  }
})

test('excluir retorna falso quando nenhum usuário é removido', async () => {
  const originalExecute = pool.execute
  pool.execute = async () => [{ affectedRows: 0 }, []]

  try {
    const excluido = await usuarioModel.excluir(999)

    assert.equal(excluido, false)
  } finally {
    pool.execute = originalExecute
  }
})
