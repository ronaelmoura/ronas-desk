import { useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!email || !senha) {
      setMensagem('Preencha o e-mail e a senha.')
      return
    }

    setMensagem('Login visual funcionando. A API será adicionada depois.')
  }

  return (
    <main className="page">
      <section className="presentation">
        <div className="brand">
          <div className="brand-logo">RT</div>

          <div>
            <strong>Ronas Desk</strong>
            <span>Suporte técnico simplificado</span>
          </div>
        </div>

        <div className="presentation-content">
          <p className="eyebrow">Sistema de chamados</p>

          <h1>
            Organize solicitações e resolva problemas com mais eficiência.
          </h1>

          <p className="description">
            Uma plataforma para registrar, acompanhar e gerenciar chamados de
            suporte técnico.
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
          <div className="mobile-logo">RT</div>

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
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="senha">Senha</label>
                <button className="forgot-button" type="button">
                  Esqueci minha senha
                </button>
              </div>

              <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
            </div>

            <button className="login-button" type="submit">
              Entrar
            </button>

            {mensagem && <p className="form-message">{mensagem}</p>}
          </form>

          <p className="register-text">
            Ainda não possui conta?
            <button type="button">Criar conta</button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App