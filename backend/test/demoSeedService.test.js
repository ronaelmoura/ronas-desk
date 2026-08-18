import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ATENDENTES_DEMO,
  CLIENTES_DEMO,
  CHAMADOS_DEMO,
  popularDadosDemonstracao,
} from '../src/services/demoSeedService.js'

test('cenário demo representa uma operação variada de suporte', () => {
  assert.ok(ATENDENTES_DEMO.length >= 4)
  assert.ok(CLIENTES_DEMO.length >= 6)
  assert.ok(CHAMADOS_DEMO.length >= 12)
  assert.deepEqual(
    new Set(CHAMADOS_DEMO.map((item) => item[4])),
    new Set([
      'Novo',
      'Em Atendimento',
      'Aguardando Cliente',
      'Resolvido',
      'Fechado',
      'Cancelado',
    ]),
  )
  assert.deepEqual(
    new Set(CHAMADOS_DEMO.map((item) => item[3])),
    new Set(['Crítica', 'Alta', 'Média', 'Baixa']),
  )
  assert.ok(new Set(CHAMADOS_DEMO.map((item) => item[2])).size >= 5)
  assert.equal(
    new Set(CHAMADOS_DEMO.map((item) => item[6])).size,
    ATENDENTES_DEMO.length,
  )
})

test('serviço exige dependências explícitas antes de acessar o banco', async () => {
  await assert.rejects(
    popularDadosDemonstracao({}),
    /Executor e hash de senha são obrigatórios/,
  )
})

function criarExecutorFake() {
  const tabelas = {
    usuarios: [],
    clientes: [],
    chamados: [],
    ticket_history: [],
    comentarios: [],
  }
  const proximoId = {
    usuarios: 1,
    clientes: 1,
    chamados: 1,
    ticket_history: 1,
    comentarios: 1,
  }

  return {
    tabelas,
    async execute(sql, parametros = []) {
      const s = sql.trim()

      if (/^SELECT id FROM usuarios WHERE email = \?/.test(s)) {
        const registro = tabelas.usuarios.find((u) => u.email === parametros[0])
        return [registro ? [{ id: registro.id }] : []]
      }
      if (s.startsWith('INSERT INTO usuarios')) {
        const [nome, email, senha_hash] = parametros
        const id = proximoId.usuarios++
        tabelas.usuarios.push({ id, nome, email, senha_hash })
        return [{ insertId: id }]
      }
      if (/^SELECT id FROM clientes WHERE email = \?/.test(s)) {
        const registro = tabelas.clientes.find((c) => c.email === parametros[0])
        return [registro ? [{ id: registro.id }] : []]
      }
      if (s.startsWith('INSERT INTO clientes')) {
        const [nome, email, telefone, empresa] = parametros
        const id = proximoId.clientes++
        tabelas.clientes.push({ id, nome, email, telefone, empresa })
        return [{ insertId: id }]
      }
      if (
        /^SELECT id FROM chamados WHERE cliente_id = \? AND titulo = \?/.test(s)
      ) {
        const [clienteId, titulo] = parametros
        const registro = tabelas.chamados.find(
          (c) => c.cliente_id === clienteId && c.titulo === titulo,
        )
        return [registro ? [{ id: registro.id }] : []]
      }
      if (s.startsWith('INSERT INTO chamados')) {
        const [cliente_id, , titulo] = parametros
        const id = proximoId.chamados++
        tabelas.chamados.push({ id, cliente_id, titulo })
        return [{ insertId: id }]
      }
      if (
        /^SELECT id FROM ticket_history WHERE ticket_id = \? AND event_type = \? AND description = \?/.test(
          s,
        )
      ) {
        const [ticketId, eventType, description] = parametros
        const registro = tabelas.ticket_history.find(
          (h) =>
            h.ticket_id === ticketId &&
            h.event_type === eventType &&
            h.description === description,
        )
        return [registro ? [{ id: registro.id }] : []]
      }
      if (s.startsWith('INSERT INTO ticket_history')) {
        const [ticket_id, , event_type, description] = parametros
        const id = proximoId.ticket_history++
        tabelas.ticket_history.push({ id, ticket_id, event_type, description })
        return [{ insertId: id }]
      }
      if (
        /^SELECT id FROM comentarios WHERE chamado_id = \? AND conteudo = \? AND tipo = \?/.test(
          s,
        )
      ) {
        const [chamadoId, conteudo, tipo] = parametros
        const registro = tabelas.comentarios.find(
          (c) =>
            c.chamado_id === chamadoId &&
            c.conteudo === conteudo &&
            c.tipo === tipo,
        )
        return [registro ? [{ id: registro.id }] : []]
      }
      if (s.startsWith('INSERT INTO comentarios')) {
        const [chamado_id, , conteudo, tipo] = parametros
        const id = proximoId.comentarios++
        tabelas.comentarios.push({ id, chamado_id, conteudo, tipo })
        return [{ insertId: id }]
      }

      throw new Error(`SQL inesperado no mock do seed demo: ${s}`)
    },
  }
}

test('popularDadosDemonstracao cria atendentes, clientes e chamados com histórico e comentários', async () => {
  const executor = criarExecutorFake()
  const agora = new Date('2026-08-17T12:00:00.000Z')

  const resumo = await popularDadosDemonstracao({
    executor,
    senhaHash: 'hash-seguro',
    agora,
  })

  assert.deepEqual(resumo, {
    atendentes: ATENDENTES_DEMO.length,
    clientes: CLIENTES_DEMO.length,
    chamados: CHAMADOS_DEMO.length,
  })
  assert.equal(executor.tabelas.usuarios.length, ATENDENTES_DEMO.length)
  assert.equal(executor.tabelas.clientes.length, CLIENTES_DEMO.length)
  assert.equal(executor.tabelas.chamados.length, CHAMADOS_DEMO.length)

  const chamadosNovos = CHAMADOS_DEMO.filter(
    (item) => item[4] === 'Novo',
  ).length
  const chamadosComPrimeiraResposta = CHAMADOS_DEMO.length - chamadosNovos
  // Cada chamado com primeira resposta gera 2 comentários (resposta pública + nota interna).
  assert.equal(
    executor.tabelas.comentarios.length,
    chamadosComPrimeiraResposta * 2,
  )

  const chamadosEncerrados = CHAMADOS_DEMO.filter((item) =>
    ['Resolvido', 'Fechado'].includes(item[4]),
  ).length
  // Todo chamado gera 1 evento de criação; chamados encerrados geram mais 1 evento de status.
  assert.equal(
    executor.tabelas.ticket_history.length,
    CHAMADOS_DEMO.length + chamadosEncerrados,
  )
})

test('popularDadosDemonstracao é idempotente ao rodar novamente sobre os mesmos dados', async () => {
  const executor = criarExecutorFake()
  const agora = new Date('2026-08-17T12:00:00.000Z')

  await popularDadosDemonstracao({ executor, senhaHash: 'hash-seguro', agora })
  const totaisPrimeiraExecucao = {
    usuarios: executor.tabelas.usuarios.length,
    clientes: executor.tabelas.clientes.length,
    chamados: executor.tabelas.chamados.length,
    ticket_history: executor.tabelas.ticket_history.length,
    comentarios: executor.tabelas.comentarios.length,
  }

  await popularDadosDemonstracao({ executor, senhaHash: 'hash-seguro', agora })

  assert.deepEqual(
    {
      usuarios: executor.tabelas.usuarios.length,
      clientes: executor.tabelas.clientes.length,
      chamados: executor.tabelas.chamados.length,
      ticket_history: executor.tabelas.ticket_history.length,
      comentarios: executor.tabelas.comentarios.length,
    },
    totaisPrimeiraExecucao,
  )
})
