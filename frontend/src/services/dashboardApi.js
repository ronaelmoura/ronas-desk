import apiClient from './apiClient'

export async function buscarDashboardApi() {
  const response = await apiClient.get('/dashboard')

  return response.data
}
