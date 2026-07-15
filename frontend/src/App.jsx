import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'

function App() {
  const [modoCadastro, setModoCadastro] = useState(false)
  const [autenticado, setAutenticado] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('')

  function limparFormulario() {
    setNome('')
    setEmail('')
    setSenha('')
    setConfirmarSenha('')
    setMensagem('')
    setTipoMensagem('')
  }

  function alternarTela() {
    setModoCadastro((valorAtual) => !valorAtual)
    limparFormulario()
  }

  function exibirErro(texto) {
    setMensagem(texto)
    setTipoMensagem('erro')
  }

  function exibirSucesso(texto) {
    setMensagem(texto)
    setTipoMensagem('sucesso')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (modoCadastro) {
      if (!nome || !email || !senha || !confirmarSenha) {
        exibirErro('Preencha todos os campos.')
        return
      }

      if (nome.trim().length < 3) {
        exibirErro('O nome precisa ter pelo menos 3 caracteres.')
        return
      }

      if (senha.length < 6) {
        exibirErro('A senha precisa ter pelo menos 6 caracteres.')
        return
      }

      if (senha !== confirmarSenha) {
        exibirErro('As senhas não são iguais.')
        return
      }

      exibirSucesso('Cadastro visual realizado com sucesso.')
      return
    }

    if (!email || !senha) {
      exibirErro('Preencha o e-mail e a senha.')
      return
    }

    setAutenticado(true)
  }

  function sairDoSistema() {
    setAutenticado(false)
    limparFormulario()
  }

  if (autenticado) {
    return <Dashboard onLogout={sairDoSistema} />
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
          <img
  className="mobile-logo-image"
  src="/logo-ronas-desk.png"
  alt="Logo Ronas Desk"
/>

          <p className="eyebrow">
            {modoCadastro ? 'Nova conta' : 'Bem-vindo'}
          </p>

          <h2>
            {modoCadastro ? 'Crie sua conta' : 'Entre na sua conta'}
          </h2>

          <p className="login-description">
            {modoCadastro
              ? 'Preencha os dados para começar a usar o Ronas Desk.'
              : 'Informe seus dados para acessar o painel do Ronas Desk.'}
          </p>

          <form onSubmit={handleSubmit}>
            {modoCadastro && (
              <div className="field">
                <label htmlFor="nome">Nome completo</label>

                <input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                />
              </div>
            )}

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

                {!modoCadastro && (
                  <button className="forgot-button" type="button">
                    Esqueci minha senha
                  </button>
                )}
              </div>

              <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
            </div>

            {modoCadastro && (
              <div className="field">
                <label htmlFor="confirmarSenha">Confirmar senha</label>

                <input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(event.target.value)
                  }
                />
              </div>
            )}

            <button className="login-button" type="submit">
              {modoCadastro ? 'Criar conta' : 'Entrar'}
            </button>

            {mensagem && (
              <p className={`form-message ${tipoMensagem}`}>
                {mensagem}
              </p>
            )}
          </form>

          <p className="register-text">
            {modoCadastro
              ? 'Já possui uma conta?'
              : 'Ainda não possui conta?'}

            <button type="button" onClick={alternarTela}>
              {modoCadastro ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App