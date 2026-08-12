import configuracaoEmpresaModel from '../models/configuracaoEmpresaModel.js'

export const CONFIGURACAO_EMPRESA_PADRAO = Object.freeze({
  nome_empresa: 'Ronas Desk',
  nome_central: 'Central de suporte',
  logo_url: null,
  cor_primaria: '#147ee8',
  cor_sidebar: '#081525',
  mensagem_boas_vindas:
    'Centralize solicitações e resolva cada atendimento com clareza.',
})

const COR_HEXADECIMAL = /^#[0-9a-fA-F]{6}$/

function texto(dados, campo, limite) {
  const valor = typeof dados?.[campo] === 'string' ? dados[campo].trim() : ''
  if (!valor || valor.length > limite) return null
  return valor
}

function normalizarLogoUrl(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor !== 'string' || valor.length > 500) return undefined

  try {
    const url = new URL(valor)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function validarConfiguracaoEmpresa(dados) {
  const nomeEmpresa = texto(dados, 'nome_empresa', 120)
  const nomeCentral = texto(dados, 'nome_central', 120)
  const mensagem = texto(dados, 'mensagem_boas_vindas', 220)
  const logoUrl = normalizarLogoUrl(dados?.logo_url)
  const corPrimaria = dados?.cor_primaria
  const corSidebar = dados?.cor_sidebar

  if (!nomeEmpresa || !nomeCentral || !mensagem) {
    return 'Preencha os nomes e a mensagem de boas-vindas.'
  }

  if (logoUrl === undefined) {
    return 'Informe uma URL HTTPS válida para a logo ou deixe o campo vazio.'
  }

  if (
    typeof corPrimaria !== 'string' ||
    typeof corSidebar !== 'string' ||
    !COR_HEXADECIMAL.test(corPrimaria) ||
    !COR_HEXADECIMAL.test(corSidebar)
  ) {
    return 'Informe cores válidas no formato hexadecimal.'
  }

  return {
    nome_empresa: nomeEmpresa,
    nome_central: nomeCentral,
    logo_url: logoUrl,
    cor_primaria: corPrimaria.toLowerCase(),
    cor_sidebar: corSidebar.toLowerCase(),
    mensagem_boas_vindas: mensagem,
  }
}

export function criarConfiguracaoEmpresaController({
  configuracoes = configuracaoEmpresaModel,
} = {}) {
  async function buscar(request, response) {
    try {
      const configuracao = await configuracoes.buscar()
      return response
        .status(200)
        .json(configuracao ?? CONFIGURACAO_EMPRESA_PADRAO)
    } catch (error) {
      console.error('Erro ao buscar identidade da empresa:', error)
      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível carregar a identidade da empresa.',
      })
    }
  }

  async function atualizar(request, response) {
    const validacao = validarConfiguracaoEmpresa(request.body)

    if (typeof validacao === 'string') {
      return response.status(400).json({
        status: 'erro',
        message: validacao,
      })
    }

    try {
      const configuracao = await configuracoes.atualizar(validacao)
      return response.status(200).json(configuracao)
    } catch (error) {
      console.error('Erro ao atualizar identidade da empresa:', error)
      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível atualizar a identidade da empresa.',
      })
    }
  }

  return { buscar, atualizar }
}

export default criarConfiguracaoEmpresaController()
