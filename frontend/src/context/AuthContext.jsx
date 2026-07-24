import { useEffect, useState } from 'react'
import {
  buscarUsuarioAtualApi,
  loginApi,
} from '../services/authApi'
import {
  CHAVE_TOKEN,
  EVENTO_SESSAO_EXPIRADA,
} from '../services/apiClient'
import AuthContext from './authContextBase'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    function encerrarSessao() {
      localStorage.removeItem(CHAVE_TOKEN)

      if (ativo) {
        setUsuario(null)
        setCarregando(false)
      }
    }

    async function verificarSessao() {
      const token = localStorage.getItem(CHAVE_TOKEN)

      if (!token) {
        setCarregando(false)
        return
      }

      try {
        const usuarioAtual = await buscarUsuarioAtualApi()

        if (ativo) {
          setUsuario(usuarioAtual)
        }
      } catch {
        encerrarSessao()
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    window.addEventListener(
      EVENTO_SESSAO_EXPIRADA,
      encerrarSessao,
    )
    verificarSessao()

    return () => {
      ativo = false
      window.removeEventListener(
        EVENTO_SESSAO_EXPIRADA,
        encerrarSessao,
      )
    }
  }, [])

  async function login(email, senha) {
    const resultado = await loginApi(email, senha)

    localStorage.setItem(CHAVE_TOKEN, resultado.token)
    setUsuario(resultado.usuario)

    return resultado.usuario
  }

  function logout() {
    localStorage.removeItem(CHAVE_TOKEN)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
