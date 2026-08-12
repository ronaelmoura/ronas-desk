import apiClient from './apiClient'

export async function listarNotificacoesApi() {
  const response = await apiClient.get('/notificacoes')
  return response.data
}

export async function marcarNotificacaoComoLidaApi(id) {
  await apiClient.patch(`/notificacoes/${id}/lida`)
}

export async function marcarTodasNotificacoesComoLidasApi() {
  await apiClient.patch('/notificacoes/ler-todas')
}
