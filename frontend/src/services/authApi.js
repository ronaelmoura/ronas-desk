import apiClient from './apiClient'

export async function loginApi(email, senha) {
  const response = await apiClient.post('/auth/login', {
    email,
    senha,
  })

  return response.data
}

export async function loginDemoApi() {
  const response = await apiClient.post('/auth/demo')

  return response.data
}

export async function buscarUsuarioAtualApi() {
  const response = await apiClient.get('/auth/me')

  return response.data
}

export async function atualizarPerfilApi(dados) {
  const response = await apiClient.patch('/auth/me', dados)

  return response.data
}

export async function alterarSenhaApi(dados) {
  const response = await apiClient.patch('/auth/me/password', dados)

  return response.data
}
