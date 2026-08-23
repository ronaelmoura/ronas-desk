import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'
import useAuth from '../../hooks/useAuth'
import useCompanyBrand from '../../hooks/useCompanyBrand'
import { IDENTIDADE_PADRAO } from '../../context/companyBrandDefaults'

vi.mock('../../hooks/useAuth')
vi.mock('../../hooks/useCompanyBrand')

describe('Login', () => {
  const login = vi.fn()
  const loginDemo = vi.fn()

  beforeEach(() => {
    login.mockReset()
    loginDemo.mockReset()
    useAuth.mockReturnValue({ login, loginDemo })
    useCompanyBrand.mockReturnValue({ configuracao: IDENTIDADE_PADRAO })
  })

  it('exibe um erro e não chama login quando o formulário é enviado vazio', async () => {
    const usuario = userEvent.setup()
    render(<Login />)

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preencha o e-mail e a senha.',
    )
    expect(login).not.toHaveBeenCalled()
  })

  it('chama login com e-mail sem espaços e a senha informada', async () => {
    const usuario = userEvent.setup()
    login.mockResolvedValue({ id: 1, nome: 'Ronael' })
    render(<Login />)

    await usuario.type(screen.getByLabelText('E-mail'), '  ronael@example.com  ')
    await usuario.type(screen.getByLabelText('Senha'), 'segredo123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(login).toHaveBeenCalledWith('ronael@example.com', 'segredo123')
  })

  it('exibe a mensagem de erro retornada pela API quando o login falha', async () => {
    const usuario = userEvent.setup()
    login.mockRejectedValue(new Error('Credenciais inválidas.'))
    render(<Login />)

    await usuario.type(screen.getByLabelText('E-mail'), 'ronael@example.com')
    await usuario.type(screen.getByLabelText('Senha'), 'senha-errada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas.')
  })

  it('limpa a mensagem de erro assim que o usuário volta a digitar', async () => {
    const usuario = userEvent.setup()
    render(<Login />)

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('E-mail'), 'r')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('alterna a visibilidade da senha ao clicar no botão de mostrar/ocultar', async () => {
    const usuario = userEvent.setup()
    render(<Login />)

    const campoSenha = screen.getByLabelText('Senha')
    expect(campoSenha).toHaveAttribute('type', 'password')

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(campoSenha).toHaveAttribute('type', 'text')

    await usuario.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(campoSenha).toHaveAttribute('type', 'password')
  })

  it('aciona loginDemo ao clicar em acessar demonstração', async () => {
    const usuario = userEvent.setup()
    loginDemo.mockResolvedValue({ id: 2, nome: 'Demo' })
    render(<Login />)

    await usuario.click(screen.getByRole('button', { name: 'Acessar demonstração' }))

    expect(loginDemo).toHaveBeenCalledTimes(1)
  })

  it('exibe o erro retornado quando o acesso à demonstração falha', async () => {
    const usuario = userEvent.setup()
    loginDemo.mockRejectedValue(new Error('Demonstração indisponível no momento.'))
    render(<Login />)

    await usuario.click(screen.getByRole('button', { name: 'Acessar demonstração' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demonstração indisponível no momento.',
    )
  })
})
