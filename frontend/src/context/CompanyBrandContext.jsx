import { useEffect, useState } from 'react'
import {
  atualizarConfiguracaoEmpresaApi,
  buscarConfiguracaoEmpresaApi,
} from '../services/configuracaoEmpresaApi'
import CompanyBrandContext from './companyBrandContextBase'
import { IDENTIDADE_PADRAO } from './companyBrandDefaults'

function aplicarIdentidade(configuracao) {
  const raiz = document.documentElement
  raiz.style.setProperty('--brand-primary', configuracao.cor_primaria)
  raiz.style.setProperty('--brand-sidebar', configuracao.cor_sidebar)
  document.title = configuracao.nome_empresa
}

export function CompanyBrandProvider({ children }) {
  const [configuracao, setConfiguracao] = useState(IDENTIDADE_PADRAO)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    buscarConfiguracaoEmpresaApi()
      .then((dados) => {
        if (ativo) setConfiguracao(dados)
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => aplicarIdentidade(configuracao), [configuracao])

  async function atualizarConfiguracao(dados) {
    const atualizada = await atualizarConfiguracaoEmpresaApi(dados)
    setConfiguracao(atualizada)
    return atualizada
  }

  async function restaurarConfiguracao() {
    return atualizarConfiguracao(IDENTIDADE_PADRAO)
  }

  return (
    <CompanyBrandContext.Provider
      value={{
        configuracao,
        carregando,
        atualizarConfiguracao,
        restaurarConfiguracao,
      }}
    >
      {children}
    </CompanyBrandContext.Provider>
  )
}
