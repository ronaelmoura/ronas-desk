import assert from 'node:assert/strict'
import test from 'node:test'
import historyService, {
  criarEventosAtualizacao,
  EVENTOS_HISTORICO,
} from '../src/services/historyService.js'

function chamado(overrides = {}) {
  return {
    id: 10,
    cliente_id: 1,
    cliente_nome: 'Empresa A',
    responsavel_id: 2,
    responsavel_nome: 'Carlos',
    titulo: 'Sem acesso',
    descricao: 'Usuário sem acesso ao sistema.',
    categoria: 'Acesso',
    prioridade: 'Média',
    status: 'Em Atendimento',
    ...overrides,
  }
}

function tipos(anterior, atual) {
  return criarEventosAtualizacao(anterior, atual).map(
    (evento) => evento.event_type,
  )
}

test('criação de chamado serializa valores e gera histórico', async () => {
  const chamadas = []
  const executor = {
    async execute(sql, valores) {
      chamadas.push({ sql, valores })
      return [{ insertId: 99 }]
    },
  }

  const evento = await historyService.registrarCriacao(chamado(), 7, executor)

  assert.equal(evento.event_type, EVENTOS_HISTORICO.CHAMADO_CRIADO)
  assert.equal(chamadas.length, 1)
  assert.deepEqual(JSON.parse(chamadas[0].valores[5]).cliente, {
    id: 1,
    nome: 'Empresa A',
  })
})

test('mudança comum de status gera STATUS_ALTERADO', () => {
  assert.deepEqual(
    tipos(chamado(), chamado({ status: 'Aguardando Cliente' })),
    [EVENTOS_HISTORICO.STATUS_ALTERADO],
  )
})

test('mudanças de prioridade e responsável geram eventos próprios', () => {
  const eventos = tipos(
    chamado(),
    chamado({
      prioridade: 'Alta',
      responsavel_id: 3,
      responsavel_nome: 'João',
    }),
  )

  assert.deepEqual(eventos, [
    EVENTOS_HISTORICO.PRIORIDADE_ALTERADA,
    EVENTOS_HISTORICO.RESPONSAVEL_ALTERADO,
  ])
})

test('mudança de cliente e informações gerais registra somente mudanças reais', () => {
  const eventos = criarEventosAtualizacao(
    chamado(),
    chamado({
      cliente_id: 4,
      cliente_nome: 'Empresa B',
      titulo: 'Novo título',
    }),
  )

  assert.deepEqual(
    eventos.map((evento) => evento.event_type),
    [EVENTOS_HISTORICO.CLIENTE_ALTERADO, EVENTOS_HISTORICO.CHAMADO_ATUALIZADO],
  )
  assert.deepEqual(eventos[1].old_values, { titulo: 'Sem acesso' })
  assert.deepEqual(eventos[1].new_values, { titulo: 'Novo título' })
})

test('resolução e fechamento não duplicam STATUS_ALTERADO', () => {
  assert.deepEqual(tipos(chamado(), chamado({ status: 'Resolvido' })), [
    EVENTOS_HISTORICO.CHAMADO_RESOLVIDO,
  ])
  assert.deepEqual(tipos(chamado(), chamado({ status: 'Fechado' })), [
    EVENTOS_HISTORICO.CHAMADO_FECHADO,
  ])
})

test('transição de encerrado para aberto registra reabertura', () => {
  assert.deepEqual(
    tipos(
      chamado({ status: 'Resolvido' }),
      chamado({ status: 'Em Atendimento' }),
    ),
    [EVENTOS_HISTORICO.CHAMADO_REABERTO],
  )
})

test('atualização sem mudança real não gera histórico', async () => {
  let gravacoes = 0
  const executor = {
    async execute() {
      gravacoes += 1
      return [{ insertId: 1 }]
    },
  }

  const atual = chamado()
  const eventos = await historyService.registrarAtualizacao(
    atual,
    { ...atual },
    7,
    executor,
  )

  assert.deepEqual(eventos, [])
  assert.equal(gravacoes, 0)
})

test('evento incompleto não gera registro vazio', async () => {
  let gravacoes = 0
  const executor = {
    async execute() {
      gravacoes += 1
    },
  }

  const resultado = await historyService.registrar(
    { ticket_id: 10, description: 'Sem tipo.' },
    executor,
  )

  assert.equal(resultado, null)
  assert.equal(gravacoes, 0)
})

test('falha de gravação é propagada para permitir rollback da transação', async () => {
  const executor = {
    async execute() {
      throw new Error('Falha simulada')
    },
  }

  await assert.rejects(
    historyService.registrarAtualizacao(
      chamado(),
      chamado({ prioridade: 'Alta' }),
      7,
      executor,
    ),
    /Falha simulada/,
  )
})

test('leitura normaliza JSON retornado como string ou objeto', async () => {
  const executor = {
    async execute() {
      return [
        [
          {
            id: 1,
            old_values: '{"status":"Novo"}',
            new_values: { status: 'Em Atendimento' },
          },
        ],
      ]
    },
  }

  const [evento] = await historyService.listarPorChamado(10, executor)

  assert.deepEqual(evento.old_values, { status: 'Novo' })
  assert.deepEqual(evento.new_values, { status: 'Em Atendimento' })
})
