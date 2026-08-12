import assert from 'node:assert/strict'
import test from 'node:test'

import { criarNotificacaoService } from '../src/services/notificacaoService.js'

function criarDependencias() {
  const criadas = []
  const usuarios = {
    listarEquipeAtiva: async () => [
      { id: 1, ativo: true },
      { id: 2, ativo: true },
      { id: 3, ativo: true },
    ],
    buscarPorClienteId: async () => ({ id: 9, ativo: true, is_demo: false }),
  }
  const notificacoes = {
    criar: async (dados) => {
      criadas.push(dados)
      return dados
    },
  }

  return {
    criadas,
    service: criarNotificacaoService({ notificacoes, usuarios }),
  }
}

const chamado = {
  id: 18,
  titulo: 'Sem acesso ao sistema',
  cliente_id: 11,
  responsavel_id: 2,
  status: 'Novo',
}

test('novo chamado notifica a equipe sem repetir o autor', async () => {
  const { criadas, service } = criarDependencias()

  await service.novoChamado(chamado, 1, {})

  assert.deepEqual(
    criadas.map((notificacao) => notificacao.usuario_id),
    [2, 3],
  )
  assert.equal(criadas[0].tipo, 'NOVO_CHAMADO')
  assert.equal(criadas[0].chamado_id, chamado.id)
})

test('atribuição e resolução disparam somente os alertas necessários', async () => {
  const { criadas, service } = criarDependencias()

  await service.atualizacaoChamado(
    { ...chamado, responsavel_id: null, status: 'Em Atendimento' },
    { ...chamado, responsavel_id: 2, status: 'Resolvido' },
    1,
    {},
  )

  assert.deepEqual(
    criadas.map((notificacao) => [notificacao.usuario_id, notificacao.tipo]),
    [
      [2, 'CHAMADO_ATRIBUIDO'],
      [9, 'AVALIACAO_DISPONIVEL'],
    ],
  )
})

test('mensagem pública da equipe notifica somente a conta do cliente', async () => {
  const { criadas, service } = criarDependencias()

  await service.comentarioDaEquipe(chamado, {})

  assert.deepEqual(
    criadas.map((notificacao) => notificacao.usuario_id),
    [9],
  )
  assert.equal(criadas[0].tipo, 'RESPOSTA_EQUIPE')
})
