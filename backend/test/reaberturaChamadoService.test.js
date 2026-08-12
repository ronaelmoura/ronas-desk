import assert from 'node:assert/strict'
import test from 'node:test'
import { criarReaberturaChamadoService } from '../src/services/reaberturaChamadoService.js'

const chamadoEncerrado = {
  id: 12,
  cliente_id: 8,
  responsavel_id: 4,
  titulo: 'Sem acesso ao sistema',
  descricao: 'Mensagem de teste',
  categoria: 'Acesso',
  prioridade: 'Alta',
  status: 'Resolvido',
  resolved_at: new Date('2026-08-12T10:00:00.000Z'),
  sla_started_at: new Date('2026-08-12T08:00:00.000Z'),
}

test('reabre chamado encerrado ao receber resposta do cliente', async () => {
  const chamadas = []
  const service = criarReaberturaChamadoService({
    chamados: {
      async atualizar(id, dados, executor) {
        chamadas.push({ tipo: 'atualizar', id, dados, executor })
        return { ...dados, id }
      },
    },
    historico: {
      async registrarAtualizacao(anterior, atual, usuarioId, executor) {
        chamadas.push({
          tipo: 'historico',
          anterior,
          atual,
          usuarioId,
          executor,
        })
      },
    },
  })
  const executor = {}
  const agora = new Date('2026-08-12T12:00:00.000Z')

  const resultado = await service.aoReceberRespostaCliente(
    chamadoEncerrado,
    20,
    executor,
    agora,
  )

  assert.equal(resultado.status, 'Em Atendimento')
  assert.equal(resultado.resolved_at, null)
  assert.equal(resultado.sla_started_at, agora)
  assert.equal(chamadas[0].tipo, 'atualizar')
  assert.equal(chamadas[1].tipo, 'historico')
  assert.equal(chamadas[1].usuarioId, 20)
})

test('mantém chamado já aberto sem registrar nova reabertura', async () => {
  const service = criarReaberturaChamadoService({
    chamados: {
      atualizar: async () => assert.fail('não deve atualizar chamado aberto'),
    },
    historico: {
      registrarAtualizacao: async () =>
        assert.fail('não deve registrar reabertura'),
    },
  })
  const chamadoAberto = { ...chamadoEncerrado, status: 'Aguardando Cliente' }

  const resultado = await service.aoReceberRespostaCliente(
    chamadoAberto,
    20,
    {},
  )

  assert.equal(resultado, chamadoAberto)
})
