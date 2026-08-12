import { useContext } from 'react'
import CompanyBrandContext from '../context/companyBrandContextBase'

export default function useCompanyBrand() {
  const contexto = useContext(CompanyBrandContext)

  if (!contexto) {
    throw new Error('useCompanyBrand deve ser usado dentro do provider.')
  }

  return contexto
}
