import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CompanyBrandProvider } from './context/CompanyBrandContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CompanyBrandProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CompanyBrandProvider>
  </StrictMode>,
)
