import relatorioModel from '../models/relatorioModel.js'
import relatorioService, {
  FiltroRelatorioInvalidoError,
  PeriodoRelatorioInvalidoError,
} from '../services/relatorioService.js'
import {
  criarRespostaPaginada,
  normalizarPaginacao,
  PaginacaoInvalidaError,
} from '../services/paginacaoService.js'

async function buscarChamados(request, response) {
  try {
    const periodo = relatorioService.normalizarPeriodo(request.query)
    const filtros = relatorioService.normalizarFiltros(request.query)
    const paginacao = normalizarPaginacao(request.query)
    const relatorio = await relatorioModel.gerarRelatorioPaginado(periodo, paginacao, filtros)

    return response
      .status(200)
      .json({
        periodo,
        filtros,
        resumo: relatorio.resumo,
        distribuicoes: relatorio.distribuicoes,
        ...criarRespostaPaginada(relatorio.chamados, relatorio.total, paginacao),
      })
  } catch (error) {
    if (
      error instanceof PeriodoRelatorioInvalidoError ||
      error instanceof FiltroRelatorioInvalidoError ||
      error instanceof PaginacaoInvalidaError
    ) {
      return response.status(400).json({
        status: 'erro',
        message: error.message,
      })
    }

    console.error('Erro ao gerar relatório de chamados:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível gerar o relatório de chamados.',
    })
  }
}

export default {
  buscarChamados,
}
