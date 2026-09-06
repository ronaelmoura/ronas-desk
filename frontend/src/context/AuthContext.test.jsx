import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import useAuth from '../hooks/useAuth'
import { CHAVE_TOKEN, EVENTO_SESSAO_EXPIRADA } from '../services/apiClient'
import {
  atualizarPerfilApi,
  buscarUsuarioAtualApi,
  loginApi,
  loginDemoApi,
} from '../services/authApi'

vi.mock('../services/authApi', () => ({
  loginApi: vi.fn(),
  loginDemoApi: vi.fn(),
  buscarUsuarioAtualApi: vi.fn(),
  atualizarPerfilApi: vi.fn(),
  alterarSenhaApi: vi.fn(),
}))

const USUARIO_LOGADO = { id: 1, nome: 'Ronael Moura', cargo: 'Administrador' }

function Sonda() {
  const auth = useAuth()

  return (
    <div>
      <span data-testid="usuario">{auth.usuario ? auth.usuario.nome : 'sem-usuario'}</span>
      <span data-testid="carregando">{String(auth.carregando)}</span>
      <button
        onClick={() => {
          auth.login('ronael@example.com', 'senha123').catch(() => {})
        }}
      >
        entrar
      </button>
      <button onClick={() => auth.logout()}>sair</button>
      <button
        onClick={() => {
          auth.atualizarPerfil({ nome: 'Ronael M.' }).catch(() => {})
        }}
      >
        atualizar
      </button>
      <button
        onClick={() => {
          auth.loginDemo().catch(() => {})
        }}
      >
        entrar-demo
      </button>
    </div>
  )
}

function renderComProvider() {
  return render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('não possui usuário autenticado e finaliza o carregamento quando não há token salvo', async () => {
    renderComProvider()

    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))
    expect(screen.getByTestId('usuario')).toHaveTextContent('sem-usuario')
    expect(buscarUsuarioAtualApi).not.toHaveBeenCalled()
  })

  it('restaura a sessão a partir de um token salvo ao montar', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'token-existente')
    buscarUsuarioAtualApi.mockResolvedValue(USUARIO_LOGADO)

    renderComProvider()

    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael Moura'),
    )
    expect(screen.getByTestId('carregando')).toHaveTextContent('false')
  })

  it('encerra a sessão quando o token salvo é inválido', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'token-invalido')
    buscarUsuarioAtualApi.mockRejectedValue(new Error('Token expirado.'))

    renderComProvider()

    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))
    expect(screen.getByTestId('usuario')).toHaveTextContent('sem-usuario')
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('login bem-sucedido define o usuário e persiste o token', async () => {
    const usuario = userEvent.setup()
    loginApi.mockResolvedValue({ token: 'novo-token', usuario: USUARIO_LOGADO })
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))

    await usuario.click(screen.getByText('entrar'))

    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael Moura'),
    )
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('novo-token')
  })

  it('login com falha não define usuário nem persiste token', async () => {
    const usuario = userEvent.setup()
    loginApi.mockRejectedValue(new Error('Credenciais inválidas.'))
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))

    await usuario.click(screen.getByText('entrar'))

    await waitFor(() => expect(loginApi).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('usuario')).toHaveTextContent('sem-usuario')
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('logout limpa o usuário e remove o token do localStorage', async () => {
    const usuario = userEvent.setup()
    loginApi.mockResolvedValue({ token: 'novo-token', usuario: USUARIO_LOGADO })
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))

    await usuario.click(screen.getByText('entrar'))
    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael Moura'),
    )

    await usuario.click(screen.getByText('sair'))

    expect(screen.getByTestId('usuario')).toHaveTextContent('sem-usuario')
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('encerra a sessão automaticamente ao receber o evento de sessão expirada', async () => {
    const usuario = userEvent.setup()
    loginApi.mockResolvedValue({ token: 'novo-token', usuario: USUARIO_LOGADO })
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))

    await usuario.click(screen.getByText('entrar'))
    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael Moura'),
    )

    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))

    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('sem-usuario'),
    )
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('atualizarPerfil substitui os dados do usuário em memória pelo retorno da API', async () => {
    const usuario = userEvent.setup()
    loginApi.mockResolvedValue({ token: 'novo-token', usuario: USUARIO_LOGADO })
    atualizarPerfilApi.mockResolvedValue({ ...USUARIO_LOGADO, nome: 'Ronael M.' })
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))
    await usuario.click(screen.getByText('entrar'))
    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael Moura'),
    )

    await usuario.click(screen.getByText('atualizar'))

    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Ronael M.'),
    )
    expect(atualizarPerfilApi).toHaveBeenCalledWith({ nome: 'Ronael M.' })
  })

  it('loginDemo define o usuário de demonstração e persiste o token', async () => {
    const usuario = userEvent.setup()
    loginDemoApi.mockResolvedValue({
      token: 'token-demo',
      usuario: { id: 99, nome: 'Usuário Demo', cargo: 'Administrador' },
    })
    renderComProvider()
    await waitFor(() => expect(screen.getByTestId('carregando')).toHaveTextContent('false'))

    await usuario.click(screen.getByText('entrar-demo'))

    await waitFor(() =>
      expect(screen.getByTestId('usuario')).toHaveTextContent('Usuário Demo'),
    )
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('token-demo')
  })
})
