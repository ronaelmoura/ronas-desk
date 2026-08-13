import dashboardModel from '../models/dashboardModel.js'
import relatorioService, {
  PeriodoRelatorioInvalidoError,
} from '../services/relatorioService.js'

export function obterPeriodo(query = {}) {
  const dataInicio = query.data_inicio
  const dataFim = query.data_fim

  if (!dataInicio && !dataFim) {
    return null
  }

  if (!dataInicio || !dataFim) {
    throw new PeriodoRelatorioInvalidoError(
      'Informe a data inicial e a data final.',
    )
  }

  return relatorioService.normalizarPeriodo({
    data_inicio: dataInicio,
    data_fim: dataFim,
  })
}

export function filtrarChamadosPorPeriodo(chamados, periodo) {
  if (!periodo) return chamados

  const inicio = new Date(`${periodo.data_inicio}T00:00:00.000Z`)
  const fimExclusivo = new Date(`${periodo.data_fim}T00:00:00.000Z`)
  fimExclusivo.setUTCDate(fimExclusivo.getUTCDate() + 1)

  return chamados.filter((chamado) => {
    const criadoEm = new Date(chamado.created_at)

    return (
      !Number.isNaN(criadoEm.getTime()) &&
      criadoEm >= inicio &&
      criadoEm < fimExclusivo
    )
  })
}

async function buscarResumo(request, response) {
  try {
    const periodo = obterPeriodo(request.query)

    const [resumo, indicadoresSla] = await Promise.all([
      dashboardModel.buscarResumo(
        periodo?.data_inicio ?? null,
        periodo?.data_fim ?? null,
      ),
      dashboardModel.buscarIndicadoresSla(
        periodo?.data_inicio ?? null,
        periodo?.data_fim ?? null,
      ),
    ])

    return response.status(200).json({
      ...resumo,
      periodo,
      chamados_recentes: resumo.chamados_recentes,
      ...indicadoresSla,
    })
  } catch (error) {
    if (error instanceof PeriodoRelatorioInvalidoError) {
      return response.status(400).json({
        status: 'erro',
        message: error.message,
      })
    }

    console.error('Erro ao buscar dados do dashboard:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar o dashboard.',
    })
  }
}

export default {
  buscarResumo,
}
