import apiClient from './apiClient'

export async function loginApi(email, senha) {
  const response = await apiClient.post('/auth/login', {
    email,
    senha,
  })

  return response.data
}

export async function buscarUsuarioAtualApi() {
  const response = await apiClient.get('/auth/me')

  return response.data
}
