import dashboardModel from '../models/dashboardModel.js'

async function buscarResumo(request, response) {
  try {
    const resumo = await dashboardModel.buscarResumo()

    return response.status(200).json(resumo)
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
