// Teste de integração do cálculo de SLA contra um MySQL real.
//
// backend/test/dashboard.test.js já cobre buscarIndicadoresSla com um
// executor mockado — útil para testar a forma da resposta, mas incapaz de
// provar que o SQL real (TIMESTAMPDIFF, CASE por prioridade, NOW()) calcula
// os minutos certos. Aqui os chamados são inseridos com timestamps fixos e
// os números esperados são calculados à mão, para validar a query de verdade
// batendo no MySQL, através do endpoint HTTP GET /api/dashboard.
import assert from 'node:assert/strict'
import test, { afterEach, after } from 'node:test'
import {
  limparBanco,
  fecharPool,
  criarUsuario,
  criarCliente,
  criarChamado,
  subirServidor,
  login,
} from './helpers.js'

afterEach(limparBanco)
after(fecharPool)

function minutosAtras(minutos) {
  return new Date(Date.now() - minutos * 60000)
}

test('GET /api/dashboard calcula SLA vencido, próximo do vencimento e tempos médios com dados reais', async () => {
  const senha = 'senha-correta-123'
  await criarUsuario({
    email: 'atendente-sla@example.com',
    senha,
    cargo: 'Atendente',
  })
  const cliente = await criarCliente({ email: 'cliente-sla@example.com' })

  // Crítica (limite 120 min), aberto há 130 min => já vencido.
  await criarChamado({
    cliente_id: cliente.id,
    titulo: 'Chamado crítico vencido',
    categoria: 'Software',
    prioridade: 'Crítica',
    status: 'Em Atendimento',
    created_at: minutosAtras(130),
  })

  // Alta (limite 480 min), aberto há 400 min => 80% já passou (384 min), mas
  // ainda não venceu: cai em "próximo do vencimento".
  await criarChamado({
    cliente_id: cliente.id,
    titulo: 'Chamado alta próximo do vencimento',
    categoria: 'Rede',
    prioridade: 'Alta',
    status: 'Aguardando Cliente',
    created_at: minutosAtras(400),
  })

  // Baixa (limite 4320 min), aberto há só 10 min => dentro do prazo,
  // não deve contar em nenhum dos dois indicadores de SLA.
  await criarChamado({
    cliente_id: cliente.id,
    titulo: 'Chamado baixa dentro do prazo',
    categoria: 'Hardware',
    prioridade: 'Baixa',
    status: 'Novo',
    created_at: minutosAtras(10),
  })

  // Resolvido: criado e resolvido em timestamps fixos (não depende de NOW()),
  // então o tempo médio de resolução é exatamente 240 min. A primeira
  // resposta também é fixa: exatamente 15 min após a criação.
  const criadoEm = new Date('2026-08-01T09:00:00.000Z')
  await criarChamado({
    cliente_id: cliente.id,
    titulo: 'Chamado resolvido com tempos fixos',
    categoria: 'Acesso',
    prioridade: 'Média',
    status: 'Resolvido',
    created_at: criadoEm,
    resolved_at: new Date(criadoEm.getTime() + 240 * 60000),
    first_response_at: new Date(criadoEm.getTime() + 15 * 60000),
  })

  const { baseUrl, fechar } = await subirServidor()

  try {
    const { body: loginBody } = await login(
      baseUrl,
      'atendente-sla@example.com',
      senha,
    )
    const resposta = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    })
    const corpo = await resposta.json()

    assert.equal(resposta.status, 200)
    assert.equal(corpo.total_chamados, 4)
    assert.equal(corpo.sla_vencidos, 1)
    assert.equal(corpo.sla_proximos_vencimento, 1)
    assert.equal(corpo.tempo_medio_resolucao_minutos, 240)
    assert.equal(corpo.tempo_medio_primeira_resposta_minutos, 15)
  } finally {
    await fechar()
  }
})
