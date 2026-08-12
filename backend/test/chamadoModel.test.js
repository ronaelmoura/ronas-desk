import assert from 'node:assert/strict'
import test from 'node:test'
import chamadoModel from '../src/models/chamadoModel.js'

test('lista chamados com a data da primeira resposta', async () => {
  const chamados = [
    {
      id: 9,
      first_response_at: new Date('2026-08-01T12:30:00.000Z'),
    },
  ]
  const chamadas = []
  const executor = {
    async query(sql) {
      chamadas.push(sql)
      return [chamados, []]
    },
  }

  const resultado = await chamadoModel.listar(executor)

  assert.equal(resultado, chamados)
  assert.equal(chamadas.length, 1)
  assert.match(chamadas[0], /chamados\.first_response_at/)
})

test('consulta chamados do portal com o cliente parametrizado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[{ id: 3, cliente_id: 8 }], []]
    },
  }

  const chamados = await chamadoModel.listarPorCliente(8, executor)

  assert.equal(chamados[0].cliente_id, 8)
  assert.match(chamadas[0].sql, /WHERE cliente_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [8])
})

test('busca do portal exige o id do chamado e o cliente vinculado', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[{ id: 9, cliente_id: 8 }], []]
    },
  }

  const chamado = await chamadoModel.buscarPorIdDoCliente(9, 8, executor)

  assert.equal(chamado.id, 9)
  assert.match(chamadas[0].sql, /id = \? AND cliente_id = \?/)
  assert.deepEqual(chamadas[0].parametros, [9, 8])
})

test('aceita como responsável somente integrante ativo da equipe', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return [[{ id: 4, nome: 'Atendente' }], []]
    },
  }

  const responsavel = await chamadoModel.buscarResponsavelAtivo(4, executor)

  assert.equal(responsavel.id, 4)
  assert.match(chamadas[0].sql, /cargo IN \('Administrador', 'Atendente'\)/)
  assert.match(chamadas[0].sql, /is_demo = FALSE/)
  assert.deepEqual(chamadas[0].parametros, [4])
})
