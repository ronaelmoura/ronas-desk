import api from './api'

async function tratarResposta(promise) {
  try {
    const response = await promise
    return response.data
  } catch (error) {
    console.error('ERRO API:', error)

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Não foi possível concluir a operação.',
    )
  }
}


export function listarChamadosApi() {
  return tratarResposta(
    api.get('/chamados'),
  )
}


export function criarChamadoApi(dados) {
  return tratarResposta(
    api.post('/chamados', dados),
  )
}


export function atualizarChamadoApi(id, dados) {
  return tratarResposta(
    api.put(`/chamados/${id}`, dados),
  )
}


export function excluirChamadoApi(id) {
  return tratarResposta(
    api.delete(`/chamados/${id}`),
  )
}