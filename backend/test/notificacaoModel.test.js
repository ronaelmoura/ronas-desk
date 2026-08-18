import assert from 'node:assert/strict'
import test from 'node:test'

import notificacaoModel from '../src/models/notificacaoModel.js'

test('marca notificação apenas quando ela pertence ao usuário', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ affectedRows: 1 }, []]
    },
  }

  const atualizada = await notificacaoModel.marcarComoLida(6, 3, executor)

  assert.equal(atualizada, true)
  assert.match(chamadas[0].sql, /WHERE id = \? AND usuario_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [6, 3])
})

test('marcarComoLida retorna falso quando nenhuma linha é afetada', async () => {
  const executor = {
    async execute() {
      return [{ affectedRows: 0 }, []]
    },
  }

  const atualizada = await notificacaoModel.marcarComoLida(99, 3, executor)

  assert.equal(atualizada, false)
})

test('criar insere a notificação e retorna os dados com o id gerado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ insertId: 42 }, []]
    },
  }

  const dados = {
    usuario_id: 3,
    chamado_id: 10,
    tipo: 'chamado_atualizado',
    titulo: 'Chamado atualizado',
    mensagem: 'O chamado #10 foi atualizado.',
  }

  const criada = await notificacaoModel.criar(dados, executor)

  assert.match(chamadas[0].sql, /INSERT INTO notificacoes/)
  assert.deepEqual(chamadas[0].parametros, [
    3,
    10,
    'chamado_atualizado',
    'Chamado atualizado',
    'O chamado #10 foi atualizado.',
  ])
  assert.deepEqual(criada, { id: 42, ...dados, lida_em: null })
})

test('criar usa null quando chamado_id não é informado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{ insertId: 7 }, []]
    },
  }

  const dados = {
    usuario_id: 5,
    tipo: 'sistema',
    titulo: 'Aviso',
    mensagem: 'Mensagem do sistema.',
  }

  await notificacaoModel.criar(dados, executor)

  assert.equal(chamadas[0].parametros[1], null)
})

test('listarPorUsuario retorna as notificações do usuário informado', async () => {
  const chamadas = []
  const linhas = [
    {
      id: 1,
      chamado_id: 10,
      tipo: 'chamado_atualizado',
      titulo: 'A',
      mensagem: 'msg',
      lida_em: null,
      created_at: '2026-08-01',
      chamado_titulo: 'Chamado 10',
    },
  ]
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [linhas, []]
    },
  }

  const resultado = await notificacaoModel.listarPorUsuario(3, executor)

  assert.match(chamadas[0].sql, /WHERE notificacoes\.usuario_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [3])
  assert.deepEqual(resultado, linhas)
})

test('contarNaoLidas retorna o total convertido em número', async () => {
  const executor = {
    async execute() {
      return [[{ total: '4' }], []]
    },
  }

  const total = await notificacaoModel.contarNaoLidas(3, executor)

  assert.equal(total, 4)
})

test('contarNaoLidas retorna zero quando não há resultado', async () => {
  const executor = {
    async execute() {
      return [[], []]
    },
  }

  const total = await notificacaoModel.contarNaoLidas(3, executor)

  assert.equal(total, 0)
})

test('marcarTodasComoLidas executa a atualização para o usuário informado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [{}, []]
    },
  }

  await notificacaoModel.marcarTodasComoLidas(3, executor)

  assert.match(chamadas[0].sql, /WHERE usuario_id = \? AND lida_em IS NULL/)
  assert.deepEqual(chamadas[0].parametros, [3])
})
