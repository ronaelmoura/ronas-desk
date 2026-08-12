import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CONFIGURACAO_EMPRESA_PADRAO,
  criarConfiguracaoEmpresaController,
  validarConfiguracaoEmpresa,
} from '../src/controllers/configuracaoEmpresaController.js'

function criarResposta() {
  return {
    statusCode: null,
    body: null,
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('retorna identidade padrão quando ainda não há configuração salva', async () => {
  const controller = criarConfiguracaoEmpresaController({
    configuracoes: { buscar: async () => null },
  })
  const response = criarResposta()

  await controller.buscar({}, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, CONFIGURACAO_EMPRESA_PADRAO)
})

test('normaliza configuração válida e aceita logo HTTPS', () => {
  const resultado = validarConfiguracaoEmpresa({
    nome_empresa: '  Empresa Exemplo  ',
    nome_central: ' Suporte ',
    logo_url: 'https://cdn.example.com/logo.png',
    cor_primaria: '#AABBCC',
    cor_sidebar: '#102030',
    mensagem_boas_vindas: ' Bem-vindo ao suporte. ',
  })

  assert.deepEqual(resultado, {
    nome_empresa: 'Empresa Exemplo',
    nome_central: 'Suporte',
    logo_url: 'https://cdn.example.com/logo.png',
    cor_primaria: '#aabbcc',
    cor_sidebar: '#102030',
    mensagem_boas_vindas: 'Bem-vindo ao suporte.',
  })
})

test('rejeita logo insegura e cores inválidas', () => {
  const base = {
    nome_empresa: 'Empresa',
    nome_central: 'Suporte',
    mensagem_boas_vindas: 'Bem-vindo.',
  }

  assert.equal(
    validarConfiguracaoEmpresa({
      ...base,
      logo_url: 'http://example.com/logo.png',
      cor_primaria: '#147ee8',
      cor_sidebar: '#081525',
    }),
    'Informe uma URL HTTPS válida para a logo ou deixe o campo vazio.',
  )

  assert.equal(
    validarConfiguracaoEmpresa({
      ...base,
      logo_url: '',
      cor_primaria: 'blue',
      cor_sidebar: '#081525',
    }),
    'Informe cores válidas no formato hexadecimal.',
  )
})

test('atualiza somente os campos validados', async () => {
  let dadosRecebidos
  const controller = criarConfiguracaoEmpresaController({
    configuracoes: {
      atualizar: async (dados) => {
        dadosRecebidos = dados
        return dados
      },
    },
  })
  const response = criarResposta()

  await controller.atualizar(
    {
      body: {
        ...CONFIGURACAO_EMPRESA_PADRAO,
        campo_indevido: 'ignorado',
      },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal('campo_indevido' in dadosRecebidos, false)
})
