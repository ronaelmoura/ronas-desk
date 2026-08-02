import { useEffect, useState } from 'react'
import {
  alterarSenhaApi,
  atualizarPerfilApi,
  buscarUsuarioAtualApi,
  loginApi,
} from '../services/authApi'
import {
  CHAVE_TOKEN,
  EVENTO_SESSAO_EXPIRADA,
} from '../services/apiClient'
import AuthContext from './authContextBase'

const CHAVE_PERFIL_LEGADO = 'ronas-desk-perfil'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    localStorage.removeItem(CHAVE_PERFIL_LEGADO)

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

  async function atualizarPerfil(dados) {
    const usuarioAtualizado = await atualizarPerfilApi(dados)

    setUsuario(usuarioAtualizado)

    return usuarioAtualizado
  }

  async function alterarSenha(dados) {
    return alterarSenhaApi(dados)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        login,
        logout,
        atualizarPerfil,
        alterarSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
