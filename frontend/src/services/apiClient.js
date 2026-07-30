import axios from 'axios'

export const CHAVE_TOKEN = 'ronas-desk-token'
export const EVENTO_SESSAO_EXPIRADA = 'ronas-desk-sessao-expirada'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(CHAVE_TOKEN)
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))
    }

    const erroApi = new Error(
      error.response?.data?.message ||
      error.message ||
      'Não foi possível concluir a operação.',
    )

    erroApi.status = error.response?.status

    return Promise.reject(erroApi)
  },
)

export default apiClient
