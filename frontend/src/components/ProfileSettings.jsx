import { useState } from 'react'
import './ProfileSettings.css'

function ProfileSettings({ perfil, onSave }) {
  const [nome, setNome] = useState(perfil.nome)
  const [email, setEmail] = useState(perfil.email)
  const [cargo, setCargo] = useState(perfil.cargo)
  const [notificacoes, setNotificacoes] = useState(
    perfil.notificacoes,
  )

  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!nome.trim() || !email.trim() || !cargo.trim()) {
      setErro('Preencha todos os campos obrigatórios.')
      setMensagem('')
      return
    }

    onSave({
      nome: nome.trim(),
      email: email.trim(),
      cargo: cargo.trim(),
      notificacoes,
    })

    setErro('')
    setMensagem('Perfil atualizado com sucesso.')
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <p className="dashboard-eyebrow">
            Minha conta
          </p>

          <h1>Configurações</h1>

          <p>
            Atualize suas informações e preferências.
          </p>
        </div>
      </header>

      <div className="settings-grid">
        <form
          className="settings-card"
          onSubmit={handleSubmit}
        >
          <div className="settings-card-header">
            <div className="settings-avatar">
              {nome
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((parte) => parte[0])
                .join('')
                .toUpperCase() || 'US'}
            </div>

            <div>
              <h2>Informações pessoais</h2>

              <p>
                Esses dados serão exibidos no painel.
              </p>
            </div>
          </div>

          <div className="settings-field">
            <label htmlFor="settings-name">
              Nome completo
            </label>

            <input
              id="settings-name"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
            />
          </div>

          <div className="settings-field">
            <label htmlFor="settings-email">
              E-mail
            </label>

            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <div className="settings-field">
            <label htmlFor="settings-role">
              Cargo
            </label>

            <input
              id="settings-role"
              type="text"
              value={cargo}
              onChange={(event) =>
                setCargo(event.target.value)
              }
            />
          </div>

          <label className="notification-option">
            <div>
              <strong>Notificações</strong>

              <span>
                Receber avisos sobre alterações nos chamados.
              </span>
            </div>

            <input
              type="checkbox"
              checked={notificacoes}
              onChange={(event) =>
                setNotificacoes(event.target.checked)
              }
            />
          </label>

          {erro && (
            <p className="settings-message error">
              {erro}
            </p>
          )}

          {mensagem && (
            <p className="settings-message success">
              {mensagem}
            </p>
          )}

          <button
            className="save-settings-button"
            type="submit"
          >
            Salvar alterações
          </button>
        </form>

        <aside className="settings-info-card">
          <div className="settings-logo">
            <img
              src="/logo-ronas-desk.png"
              alt="Logo Ronas Desk"
            />
          </div>

          <h2>Ronas Desk</h2>

          <p>
            Sistema de gerenciamento de chamados desenvolvido
            por Ronael Moura.
          </p>

          <div className="settings-info-item">
            <span>Versão</span>
            <strong>1.0.0</strong>
          </div>

          <div className="settings-info-item">
            <span>Armazenamento atual</span>
            <strong>LocalStorage</strong>
          </div>

          <div className="settings-info-item">
            <span>Próxima etapa</span>
            <strong>API e banco de dados</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default ProfileSettings