import relatorioModel from '../models/relatorioModel.js'
import relatorioService, {
  PeriodoRelatorioInvalidoError,
} from '../services/relatorioService.js'

async function buscarChamados(request, response) {
  try {
    const periodo = relatorioService.normalizarPeriodo(request.query)
    const chamados = await relatorioModel.listarChamadosPorPeriodo(
      periodo.data_inicio,
      periodo.data_fim,
    )

    return response
      .status(200)
      .json(relatorioService.gerarRelatorio(chamados, periodo))
  } catch (error) {
    if (error instanceof PeriodoRelatorioInvalidoError) {
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
