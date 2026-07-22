import './App.css'
import Dashboard from './components/Dashboard'
import Login from './pages/Login/Login'
import useAuth from './hooks/useAuth'

function App() {
  const { usuario, carregando, logout } = useAuth()

  if (carregando) {
    return (
      <main className="session-loading">
        Validando sessão...
      </main>
    )
  }

  if (!usuario) {
    return <Login />
  }

  return <Dashboard onLogout={logout} />
}

export default App
