import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import './Login.css'

function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.')
      return
    }

    setEnviando(true)

    try {
      await login(email.trim(), senha)
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="page">
      <section className="presentation">
        <div className="brand">
          <img
            className="brand-logo-image"
            src="/logo-ronas-desk.png"
            alt="Logo Ronas Desk"
          />

          <div>
            <strong>Ronas Desk</strong>
            <span>Suporte técnico simplificado</span>
          </div>
        </div>

        <div className="presentation-content">
          <p className="eyebrow">Sistema de chamados</p>

          <h1>
            Organize solicitações e resolva problemas com mais
            eficiência.
          </h1>

          <p className="description">
            Uma plataforma para registrar, acompanhar e gerenciar
            chamados de suporte técnico.
          </p>

          <div className="features">
            <div className="feature">
              <span>01</span>
              <p>Abertura e acompanhamento de chamados</p>
            </div>

            <div className="feature">
              <span>02</span>
              <p>Controle de prioridade e status</p>
            </div>

            <div className="feature">
              <span>03</span>
              <p>Painel organizado para usuários e administradores</p>
            </div>
          </div>
        </div>

        <p className="copyright">
          © 2026 Ronas Tech — Desenvolvido por Ronael Moura
        </p>
      </section>

      <section className="login-area">
        <div className="login-card">
          <img
            className="mobile-logo-image"
            src="/logo-ronas-desk.png"
            alt="Logo Ronas Desk"
          />

          <p className="eyebrow">Bem-vindo</p>
          <h2>Entre na sua conta</h2>

          <p className="login-description">
            Informe seus dados para acessar o painel do Ronas Desk.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={enviando}
              />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>

              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={enviando}
              />
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={enviando}
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

            {erro && (
              <p className="form-message erro" role="alert">
                {erro}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
