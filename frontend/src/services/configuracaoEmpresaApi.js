import apiClient from './apiClient'

export async function buscarConfiguracaoEmpresaApi() {
  const response = await apiClient.get('/configuracao-empresa')
  return response.data
}

export async function atualizarConfiguracaoEmpresaApi(dados) {
  const response = await apiClient.put('/configuracao-empresa', dados)
  return response.data
}
