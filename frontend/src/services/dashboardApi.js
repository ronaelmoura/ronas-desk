import api from './api'

export async function buscarDashboardApi() {
  try {
    const response = await api.get('/dashboard')

    return response.data
  } catch (error) {
    console.error('ERRO API DASHBOARD:', error)

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Não foi possível carregar o dashboard.',
    )
  }
}
