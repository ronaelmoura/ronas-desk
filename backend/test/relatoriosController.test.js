import assert from 'node:assert/strict'
import test from 'node:test'

import relatoriosController from '../src/controllers/relatoriosController.js'
import relatorioModel from '../src/models/relatorioModel.js'
import relatorioService, {
  FiltroRelatorioInvalidoError,
  PeriodoRelatorioInvalidoError,
} from '../src/services/relatorioService.js'

function criarResposta() {
  return {
    statusCode: null,
    body: null,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('relatoriosController gera relatório de chamados com sucesso', async () => {
  const response = criarResposta()
  const originalNormalizarPeriodo = relatorioService.normalizarPeriodo
  const originalGerarRelatorio = relatorioModel.gerarRelatorioPaginado

  relatorioService.normalizarPeriodo = () => ({
    data_inicio: '2026-08-01',
    data_fim: '2026-08-10',
    total_dias: 10,
  })
  relatorioModel.gerarRelatorioPaginado = async () => ({
    resumo: {
      total_chamados: 2,
      chamados_abertos: 1,
      chamados_encerrados: 1,
      chamados_cancelados: 0,
      sla_cumprido_percentual: 100,
      tempo_medio_resolucao_minutos: 30,
    },
    distribuicoes: {
      status: [{ rotulo: 'Novo', total: 1 }],
      prioridade: [{ rotulo: 'Alta', total: 2 }],
      categoria: [{ rotulo: 'Acesso', total: 1 }],
      responsavel: [{ rotulo: 'Ana', total: 1 }],
    },
    chamados: [{ id: 1, titulo: 'Chamado de teste' }],
    total: 2,
  })

  try {
    await relatoriosController.buscarChamados(
      { query: { data_inicio: '2026-08-01', data_fim: '2026-08-10', pagina: '1', limite: '10' } },
      response,
    )

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.periodo.data_inicio, '2026-08-01')
    assert.deepEqual(response.body.filtros, {
      status: undefined,
      prioridade: undefined,
      categoria: undefined,
    })
    assert.equal(response.body.resumo.total_chamados, 2)
    assert.equal(response.body.paginacao.total, 2)
    assert.equal(response.body.dados[0].titulo, 'Chamado de teste')
  } finally {
    relatorioService.normalizarPeriodo = originalNormalizarPeriodo
    relatorioModel.gerarRelatorioPaginado = originalGerarRelatorio
  }
})

test('relatoriosController responde 400 para período inválido', async () => {
  const response = criarResposta()
  const originalNormalizarPeriodo = relatorioService.normalizarPeriodo

  relatorioService.normalizarPeriodo = () => {
    throw new PeriodoRelatorioInvalidoError('Data final inválida.')
  }

  try {
    await relatoriosController.buscarChamados(
      { query: { data_inicio: '2026-08-02', data_fim: '2026-08-01' } },
      response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Data final inválida.',
    })
  } finally {
    relatorioService.normalizarPeriodo = originalNormalizarPeriodo
  }
})

test('relatoriosController responde 400 para filtro inválido', async () => {
  const response = criarResposta()
  const originalNormalizarPeriodo = relatorioService.normalizarPeriodo

  relatorioService.normalizarPeriodo = () => ({
    data_inicio: '2026-08-01',
    data_fim: '2026-08-10',
    total_dias: 10,
  })

  try {
    await relatoriosController.buscarChamados(
      {
        query: {
          data_inicio: '2026-08-01',
          data_fim: '2026-08-10',
          status: 'Inexistente',
        },
      },
      response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Status inválido.',
    })
  } finally {
    relatorioService.normalizarPeriodo = originalNormalizarPeriodo
  }
})

test('relatoriosController responde 400 para paginação inválida', async () => {
  const response = criarResposta()
  const originalNormalizarPeriodo = relatorioService.normalizarPeriodo

  relatorioService.normalizarPeriodo = () => ({
    data_inicio: '2026-08-01',
    data_fim: '2026-08-10',
    total_dias: 10,
  })

  try {
    await relatoriosController.buscarChamados(
      { query: { data_inicio: '2026-08-01', data_fim: '2026-08-10', pagina: '0' } },
      response,
    )

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Página deve ser um número inteiro positivo.',
    })
  } finally {
    relatorioService.normalizarPeriodo = originalNormalizarPeriodo
  }
})

test('relatoriosController responde 500 quando a geração falha', async () => {
  const response = criarResposta()
  const originalNormalizarPeriodo = relatorioService.normalizarPeriodo
  const originalGerarRelatorio = relatorioModel.gerarRelatorioPaginado
  const originalConsoleError = console.error

  relatorioService.normalizarPeriodo = () => ({
    data_inicio: '2026-08-01',
    data_fim: '2026-08-10',
    total_dias: 10,
  })
  relatorioModel.gerarRelatorioPaginado = async () => {
    throw new Error('falha do banco')
  }
  console.error = () => {}

  try {
    await relatoriosController.buscarChamados(
      { query: { data_inicio: '2026-08-01', data_fim: '2026-08-10', pagina: '1', limite: '10' } },
      response,
    )

    assert.equal(response.statusCode, 500)
    assert.deepEqual(response.body, {
      status: 'erro',
      message: 'Não foi possível gerar o relatório de chamados.',
    })
  } finally {
    relatorioService.normalizarPeriodo = originalNormalizarPeriodo
    relatorioModel.gerarRelatorioPaginado = originalGerarRelatorio
    console.error = originalConsoleError
  }
})
