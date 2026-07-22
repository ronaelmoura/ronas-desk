import apiClient from './apiClient'

async function tratarResposta(promise) {
  const response = await promise

  return response.data
}


export function listarChamadosApi() {
  return tratarResposta(
    apiClient.get('/chamados'),
  )
}


export function criarChamadoApi(dados) {
  return tratarResposta(
    apiClient.post('/chamados', dados),
  )
}


export function atualizarChamadoApi(id, dados) {
  return tratarResposta(
    apiClient.put(`/chamados/${id}`, dados),
  )
}


export function excluirChamadoApi(id) {
  return tratarResposta(
    apiClient.delete(`/chamados/${id}`),
  )
}


export function buscarChamadoApi(id) {
  return tratarResposta(
    apiClient.get(`/chamados/${id}`),
  )
}
