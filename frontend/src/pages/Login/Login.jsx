import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, MonitorPlay } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import './Login.css'

function Login() {
  const { login, loginDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function acessarDemonstracao() {
    setErro('')
    setEnviando(true)

    try {
      await loginDemo()
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

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
            Centralize solicitações e resolva cada atendimento com clareza.
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                value={email}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? 'login-error' : undefined}
                required
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErro('')
                }}
                disabled={enviando}
              />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>

              <div className="password-input">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={senha}
                  aria-invalid={Boolean(erro)}
                  aria-describedby={erro ? 'login-error' : undefined}
                  required
                  onChange={(event) => {
                    setSenha(event.target.value)
                    setErro('')
                  }}
                  disabled={enviando}
                />

                <button
                  className="password-toggle"
                  type="button"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha((visivel) => !visivel)}
                  disabled={enviando}
                >
                  {mostrarSenha ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={enviando}
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

            {erro && (
              <p id="login-error" className="form-message erro" role="alert">
                {erro}
              </p>
            )}
          </form>

          <div className="demo-access">
            <span>ou conheça o sistema sem cadastro</span>

            <button
              className="demo-button"
              type="button"
              onClick={acessarDemonstracao}
              disabled={enviando}
            >
              <MonitorPlay size={19} aria-hidden="true" />
              {enviando ? 'Acessando...' : 'Acessar demonstração'}
            </button>

            <small>Modo seguro: os dados podem ser visualizados, mas não alterados.</small>
          </div>

          <p className="login-security-note">
            <LockKeyhole size={16} aria-hidden="true" />
            Acesso protegido para usuários cadastrados.
          </p>

          <p className="login-privacy-note">
            Utilizamos estatísticas anônimas e localização aproximada para
            entender o uso da demonstração. A localização é consultada por um
            serviço externo, sem armazenar o endereço IP no Ronas Desk.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
