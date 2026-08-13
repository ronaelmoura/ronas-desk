import apiClient from './apiClient'

async function dados(promise) {
  const response = await promise
  return response.data
}

export const listarMeusChamadosApi = (params = {}) => dados(apiClient.get('/portal/chamados', { params }))
export const buscarMeuChamadoApi = (id) => dados(apiClient.get(`/portal/chamados/${id}`))
export const criarMeuChamadoApi = (formulario) => dados(apiClient.post('/portal/chamados', formulario))
export const listarMensagensChamadoApi = (id) => dados(apiClient.get(`/portal/chamados/${id}/comentarios`))
export const enviarMensagemChamadoApi = (id, conteudo) => dados(apiClient.post(`/portal/chamados/${id}/comentarios`, { conteudo }))
export const buscarMinhaAvaliacaoApi = (id) => dados(apiClient.get(`/portal/chamados/${id}/avaliacao`))
export const avaliarChamadoApi = (id, dadosAvaliacao) => dados(apiClient.post(`/portal/chamados/${id}/avaliacao`, dadosAvaliacao))
