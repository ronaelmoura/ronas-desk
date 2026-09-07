import { useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Login from './pages/Login/Login'
import PortalCliente from './pages/PortalCliente/PortalCliente'
import useAuth from './hooks/useAuth'
import { registrarVisitaApi } from './services/visitasApi'

function App() {
  const { usuario, carregando, logout } = useAuth()

  useEffect(() => {
    if (!carregando && !usuario) {
      registrarVisitaApi('login').catch(() => {})
    }
  }, [carregando, usuario])

  if (carregando) {
    return (
      <main className="session-loading">
        <div aria-hidden="true" className="session-loading-spinner" />
        <p role="status">Validando sessão...</p>
      </main>
    )
  }

  if (!usuario) {
    return <Login />
  }

  if (usuario.cargo === 'Cliente') {
    return <PortalCliente />
  }

  return <Dashboard onLogout={logout} />
}

export default App
