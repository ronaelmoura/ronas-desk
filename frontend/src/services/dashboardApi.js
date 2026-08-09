import apiClient from './apiClient'

export async function buscarDashboardApi(periodo = null) {
  const params = periodo
    ? {
        data_inicio: periodo.data_inicio,
        data_fim: periodo.data_fim,
      }
    : undefined

  const response = await apiClient.get('/dashboard', { params })

  return response.data
}
