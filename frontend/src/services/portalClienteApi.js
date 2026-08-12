import apiClient from './apiClient'

async function dados(promise) {
  const response = await promise
  return response.data
}

export const listarMeusChamadosApi = () => dados(apiClient.get('/portal/chamados'))
export const buscarMeuChamadoApi = (id) => dados(apiClient.get(`/portal/chamados/${id}`))
export const criarMeuChamadoApi = (formulario) => dados(apiClient.post('/portal/chamados', formulario))
export const listarMensagensChamadoApi = (id) => dados(apiClient.get(`/portal/chamados/${id}/comentarios`))
export const enviarMensagemChamadoApi = (id, conteudo) => dados(apiClient.post(`/portal/chamados/${id}/comentarios`, { conteudo }))
