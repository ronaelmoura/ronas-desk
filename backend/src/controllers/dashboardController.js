import dashboardModel from '../models/dashboardModel.js'
import chamadoModel from '../models/chamadoModel.js'
import slaService from '../services/slaService.js'

async function buscarResumo(request, response) {
  try {
    const [resumo, chamados] = await Promise.all([
      dashboardModel.buscarResumo(),
      chamadoModel.listar(),
    ])
    const indicadoresSla = slaService.calcularIndicadoresDashboard(chamados)

    return response.status(200).json({
      ...resumo,
      chamados_recentes: slaService.enriquecerChamados(
        resumo.chamados_recentes,
      ),
      ...indicadoresSla,
    })
  } catch (error) {
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
