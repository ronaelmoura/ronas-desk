import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { criarApp } from '../src/app.js'
import usuarioModel from '../src/models/usuarioModel.js'
import pool from '../src/database/db.js'
import notificacaoModel from '../src/models/notificacaoModel.js'
import { criarDadosDemo } from '../src/services/demoDataService.js'

test('demonstração atende somente dados sintéticos e nunca acessa tabelas operacionais', async (t) => {
  const secretAnterior = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'chave-exclusivamente-de-teste-isolamento'
  t.after(() => {
    if (secretAnterior === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secretAnterior
  })
  let ativo = true
  let demo = true
  let falhaIdentidade = false
  let consultasOperacionais = 0
  t.mock.method(usuarioModel, 'buscarPorId', async (id) => {
    assert.equal(id, 987654)
    if (falhaIdentidade) throw new Error('Falha simulada de identidade')
    return { id, ativo, is_demo: demo, cargo: 'Administrador' }
  })
  for (const metodo of ['execute', 'query', 'getConnection']) {
    t.mock.method(pool, metodo, async () => {
      consultasOperacionais++
      throw new Error('Acesso operacional proibido no teste')
    })
  }
  const app = criarApp({ variaveis: { NODE_ENV: 'test' } })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  )
  const token = jwt.sign(
    { id: 987654, cargo: 'Administrador', is_demo: false },
    process.env.JWT_SECRET,
  )
  const consultar = (path, method = 'GET') =>
    fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
  for (const path of [
    '/dashboard',
    '/chamados',
    '/chamados/1',
    '/chamados/1/comentarios',
    '/chamados/1/anexos',
    '/chamados/1/timeline',
    '/chamados/1/history',
    '/chamados/1/auditoria',
    '/clientes',
    '/clientes/1',
    '/clientes/1/chamados',
    '/usuarios',
    '/usuarios/1',
    '/relatorios/chamados',
    '/notificacoes',
  ]) {
    const resposta = await consultar(path)
    assert.equal(resposta.status, 200, path)
    assert.equal(resposta.headers.get('cache-control'), 'private, no-store')
  }
  for (const path of [
    '/chamados/987654',
    '/clientes/987654',
    '/usuarios/987654',
    '/chamados/1/anexos/1/download',
    '/portal/chamados',
    '/avaliacoes',
    '/rota-futura',
    '/clientes/1/comentarios',
  ]) {
    assert.equal((await consultar(path)).status, 404, path)
  }
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const resposta = await consultar('/chamados/1', method)
    assert.equal(resposta.status, 403)
    assert.equal((await resposta.json()).code, 'DEMO_READ_ONLY')
  }
  assert.equal((await consultar('/chamados/1', 'HEAD')).status, 200)
  const filtrados = await (
    await consultar('/chamados?status=Novo&limite=1&pagina=999')
  ).json()
  assert.equal(filtrados.dados.length, 1)
  assert.equal(filtrados.dados[0].status, 'Novo')
  assert.equal(filtrados.paginacao.pagina, filtrados.paginacao.total_paginas)
  const relatorio = await (
    await consultar('/relatorios/chamados?status=Novo')
  ).json()
  assert.equal(relatorio.resumo.total_chamados, filtrados.paginacao.total)
  const clientes = await (await consultar('/clientes?busca=Mariana')).json()
  assert.equal(clientes.dados[0].email, 'mariana.souza@alphalog.example')
  for (const path of [
    '/chamados?limite=101',
    '/chamados?status=invalido',
    '/chamados?sla_status=invalido',
    '/relatorios/chamados?data_inicio=invalida',
  ]) {
    assert.equal((await consultar(path)).status, 400, path)
  }
  ativo = false
  assert.equal((await consultar('/dashboard')).status, 401)
  ativo = true
  falhaIdentidade = true
  t.mock.method(console, 'error', () => {})
  assert.equal((await consultar('/chamados')).status, 500)
  falhaIdentidade = false
  demo = false
  t.mock.method(notificacaoModel, 'listarPorUsuario', async () => [
    { id: 999, titulo: 'Registro operacional' },
  ])
  t.mock.method(notificacaoModel, 'contarNaoLidas', async () => 1)
  const normal = await (await consultar('/notificacoes')).json()
  assert.equal(normal.notificacoes[0].id, 999)
  assert.equal(normal.naoLidas, 1)
  assert.equal(consultasOperacionais, 0)
})

test('dados demo têm vínculos válidos, datas renovadas e nenhuma referência compartilhada', () => {
  const agora = new Date('2026-10-05T12:00:00Z')
  const dados = criarDadosDemo(agora)
  assert.ok(dados.usuarios.every((usuario) => usuario.cargo === 'Atendente'))
  for (const chamado of dados.chamados) {
    assert.ok(
      dados.clientes.some((cliente) => cliente.id === chamado.cliente_id),
    )
    assert.ok(
      dados.usuarios.some((usuario) => usuario.id === chamado.responsavel_id),
    )
    assert.ok(new Date(chamado.created_at) <= agora)
    assert.ok(chamado.sla)
  }
  dados.clientes[0].nome = 'Alterado'
  assert.notEqual(criarDadosDemo(agora).clientes[0].nome, 'Alterado')
})
