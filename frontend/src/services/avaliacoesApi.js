import apiClient from './apiClient'

export async function listarAvaliacoesApi() {
  const response = await apiClient.get('/avaliacoes')
  return response.data
}
