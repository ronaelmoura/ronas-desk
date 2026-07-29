import assert from 'node:assert/strict'
import test from 'node:test'
import anexoModel from '../src/models/anexoModel.js'

function criarExecutor(respostas = []) {
  const chamadas = []

  return {
    chamadas,
    async execute(sql, parametros) {
      chamadas.push({ sql, parametros })
      return respostas.shift() ?? [[], []]
    },
  }
}

test('lista anexos do chamado em ordem cronológica', async () => {
  const anexos = [
    { id: 1, nome_original: 'erro.png' },
    { id: 2, nome_original: 'relatorio.pdf' },
  ]
  const executor = criarExecutor([[anexos, []]])

  const resultado = await anexoModel.listarPorChamado(12, executor)

  assert.equal(resultado, anexos)
  assert.match(executor.chamadas[0].sql, /WHERE anexos\.chamado_id = \?/)
  assert.match(
    executor.chamadas[0].sql,
    /ORDER BY anexos\.created_at ASC, anexos\.id ASC/,
  )
  assert.deepEqual(executor.chamadas[0].parametros, [12])
})

test('cria anexo e retorna o registro usando o mesmo executor', async () => {
  const anexoCriado = {
    id: 8,
    chamado_id: 12,
    nome_original: 'evidencia.png',
  }
  const executor = criarExecutor([
    [{ insertId: 8 }, []],
    [[anexoCriado], []],
  ])
  const dados = {
    chamado_id: 12,
    usuario_id: 3,
    nome_original: 'evidencia.png',
    mime_type: 'image/png',
    tamanho_bytes: 2048,
    cloudinary_public_id: 'ronas-desk/chamados/12/arquivo.png',
    cloudinary_asset_id: 'asset-123',
    formato: 'png',
  }

  const resultado = await anexoModel.criar(dados, executor)

  assert.equal(resultado, anexoCriado)
  assert.match(executor.chamadas[0].sql, /INSERT INTO anexos/)
  assert.deepEqual(executor.chamadas[0].parametros, [
    12,
    3,
    'evidencia.png',
    'image/png',
    2048,
    'ronas-desk/chamados/12/arquivo.png',
    'asset-123',
    'png',
  ])
  assert.deepEqual(executor.chamadas[1].parametros, [12, 8])
})

test('exclusão restringe o anexo ao chamado informado', async () => {
  const executor = criarExecutor([[{ affectedRows: 1 }, []]])

  const excluido = await anexoModel.excluir(12, 8, executor)

  assert.equal(excluido, true)
  assert.match(executor.chamadas[0].sql, /chamado_id = \?/)
  assert.match(executor.chamadas[0].sql, /id = \?/)
  assert.deepEqual(executor.chamadas[0].parametros, [12, 8])
})
