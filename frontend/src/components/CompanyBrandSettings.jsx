import { useEffect, useState } from 'react'
import { Building2, RotateCcw } from 'lucide-react'
import useCompanyBrand from '../hooks/useCompanyBrand'
import { usarLogoPadrao } from '../utils/companyBrand'

function CompanyBrandSettings() {
  const {
    configuracao,
    atualizarConfiguracao,
    restaurarConfiguracao,
  } = useCompanyBrand()
  const [formulario, setFormulario] = useState(configuracao)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => setFormulario(configuracao), [configuracao])

  function alterarCampo(event) {
    const { name, value } = event.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
    setMensagem('')
    setErro('')
  }

  async function salvar(event) {
    event.preventDefault()
    setSalvando(true)
    setMensagem('')
    setErro('')

    try {
      await atualizarConfiguracao({
        ...formulario,
        logo_url: formulario.logo_url?.trim() || null,
      })
      setMensagem('Identidade da empresa atualizada com sucesso.')
    } catch (error) {
      setErro(error.message)
    } finally {
      setSalvando(false)
    }
  }

  async function restaurar() {
    setSalvando(true)
    setMensagem('')
    setErro('')

    try {
      await restaurarConfiguracao()
      setMensagem('Identidade padrão do Ronas Desk restaurada.')
    } catch (error) {
      setErro(error.message)
    } finally {
      setSalvando(false)
    }
  }

  const logo = formulario.logo_url?.trim() || '/brand-mark.svg'

  return (
    <form className="settings-card company-brand-card" onSubmit={salvar}>
      <div className="settings-card-header">
        <div className="settings-brand-icon" aria-hidden="true">
          <Building2 />
        </div>
        <div>
          <h2>Identidade da empresa</h2>
          <p>Personalize a marca exibida no login e no painel.</p>
        </div>
      </div>

      <div className="company-brand-preview" style={{ background: formulario.cor_sidebar }}>
        <img
          src={logo}
          alt="Pré-visualização da logo"
          onError={usarLogoPadrao}
        />
        <div>
          <strong>{formulario.nome_empresa || 'Nome da empresa'}</strong>
          <span>{formulario.nome_central || 'Central de suporte'}</span>
        </div>
        <i style={{ background: formulario.cor_primaria }} aria-hidden="true" />
      </div>

      <div className="settings-field">
        <label htmlFor="company-name">Nome da empresa</label>
        <input id="company-name" name="nome_empresa" maxLength="120" value={formulario.nome_empresa} onChange={alterarCampo} disabled={salvando} required />
      </div>

      <div className="settings-field">
        <label htmlFor="support-name">Nome da central</label>
        <input id="support-name" name="nome_central" maxLength="120" value={formulario.nome_central} onChange={alterarCampo} disabled={salvando} required />
      </div>

      <div className="settings-field">
        <label htmlFor="company-logo">URL HTTPS da logo</label>
        <input id="company-logo" name="logo_url" type="url" maxLength="500" placeholder="https://exemplo.com/logo.png" value={formulario.logo_url ?? ''} onChange={alterarCampo} disabled={salvando} />
        <small className="settings-field-help">Deixe vazio para utilizar a logo padrão do Ronas Desk.</small>
      </div>

      <div className="company-color-grid">
        <div className="settings-field">
          <label htmlFor="primary-color">Cor principal</label>
          <input id="primary-color" name="cor_primaria" type="color" value={formulario.cor_primaria} onChange={alterarCampo} disabled={salvando} />
        </div>
        <div className="settings-field">
          <label htmlFor="sidebar-color">Cor do menu lateral</label>
          <input id="sidebar-color" name="cor_sidebar" type="color" value={formulario.cor_sidebar} onChange={alterarCampo} disabled={salvando} />
        </div>
      </div>

      <div className="settings-field">
        <label htmlFor="welcome-message">Mensagem de boas-vindas</label>
        <textarea id="welcome-message" name="mensagem_boas_vindas" maxLength="220" rows="3" value={formulario.mensagem_boas_vindas} onChange={alterarCampo} disabled={salvando} required />
        <small className="settings-field-help">{formulario.mensagem_boas_vindas.length}/220 caracteres</small>
      </div>

      {erro && <p className="settings-message error" role="alert">{erro}</p>}
      {mensagem && <p className="settings-message success" role="status">{mensagem}</p>}

      <div className="company-brand-actions">
        <button className="restore-brand-button" type="button" onClick={restaurar} disabled={salvando}>
          <RotateCcw size={17} aria-hidden="true" />
          Restaurar padrão
        </button>
        <button className="save-settings-button" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar identidade'}
        </button>
      </div>
    </form>
  )
}

export default CompanyBrandSettings
