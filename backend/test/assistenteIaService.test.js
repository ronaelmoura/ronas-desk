import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AssistenteIaErroError,
  AssistenteIaIndisponivelError,
  gerarResumoChamado,
} from '../src/services/assistenteIaService.js'

const dados = {
  chamado: {
    titulo: 'Computador lento',
    descricao: 'O navegador demora para abrir.',
    categoria: 'Hardware',
    prioridade: 'Média',
    status: 'Em Atendimento',
  },
  comentarios: [{ tipo: 'INTERNO', conteudo: 'Senha: exemplo-secreto' }],
  historico: [{ description: 'Chamado criado.' }],
}

test('não consulta o Gemini sem uma chave configurada', async () => {
  let chamadas = 0

  await assert.rejects(
    gerarResumoChamado(dados, {
      apiKey: '',
      requisicao: async () => {
        chamadas += 1
      },
    }),
    AssistenteIaIndisponivelError,
  )

  assert.equal(chamadas, 0)
})

test('envia contexto limitado, oculta credenciais reconhecíveis e exige JSON estruturado', async () => {
  let corpo

  const resultado = await gerarResumoChamado(dados, {
    apiKey: 'chave-de-teste',
    requisicao: async (_url, opcoes) => {
      corpo = JSON.parse(opcoes.body)
      return {
        ok: true,
        async json() {
          return {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        resumo: 'Equipamento em análise.',
                        acoes_realizadas: ['Chamado criado.'],
                        proximos_passos: ['Verificar uso de memória.'],
                      }),
                    },
                  ],
                },
              },
            ],
          }
        },
      }
    },
  })

  assert.equal(resultado.resumo, 'Equipamento em análise.')
  assert.match(corpo.contents[0].parts[0].text, /Senha: \[oculto\]/)
  assert.doesNotMatch(corpo.contents[0].parts[0].text, /exemplo-secreto/)
  assert.equal(corpo.generationConfig.responseMimeType, 'application/json')
  assert.deepEqual(corpo.generationConfig.responseSchema, {
    type: 'object',
    properties: {
      resumo: {
        type: 'string',
        description:
          'Resumo objetivo do cenário atual do chamado, baseado somente nos dados recebidos.',
      },
      acoes_realizadas: {
        type: 'array',
        description: 'Ações já registradas no chamado.',
        items: { type: 'string' },
      },
      proximos_passos: {
        type: 'array',
        description: 'Próximos passos práticos para a equipe.',
        items: { type: 'string' },
      },
    },
    required: ['resumo', 'acoes_realizadas', 'proximos_passos'],
  })
  assert.equal(corpo.generationConfig.responseJsonSchema, undefined)
  assert.equal(corpo.generationConfig.responseFormat, undefined)
  assert.deepEqual(corpo.generationConfig.thinkingConfig, {
    thinkingLevel: 'low',
  })
})

test('ignora partes de raciocínio antes de interpretar o JSON final', async () => {
  const resultado = await gerarResumoChamado(dados, {
    apiKey: 'chave-de-teste',
    requisicao: async () => ({
      ok: true,
      async json() {
        return {
          candidates: [
            {
              content: {
                parts: [
                  { thought: true, text: 'Raciocínio interno do modelo.' },
                  {
                    text: JSON.stringify({
                      resumo: 'ERP em análise.',
                      acoes_realizadas: ['Equipe acionada.'],
                      proximos_passos: ['Validar conectividade.'],
                    }),
                  },
                ],
              },
            },
          ],
        }
      },
    }),
  })

  assert.equal(resultado.resumo, 'ERP em análise.')
  assert.deepEqual(resultado.acoes_realizadas, ['Equipe acionada.'])
})

test('aceita JSON protegido por bloco de código como contingência segura', async () => {
  const resultado = await gerarResumoChamado(dados, {
    apiKey: 'chave-de-teste',
    requisicao: async () => ({
      ok: true,
      async json() {
        return {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `\`\`\`json\n${JSON.stringify({
                      resumo: 'Impressora em análise.',
                      acoes_realizadas: [],
                      proximos_passos: ['Testar o driver.'],
                    })}\n\`\`\``,
                  },
                ],
              },
            },
          ],
        }
      },
    }),
  })

  assert.equal(resultado.resumo, 'Impressora em análise.')
  assert.deepEqual(resultado.proximos_passos, ['Testar o driver.'])
})

test('falha do provedor não expõe detalhes internos', async () => {
  await assert.rejects(
    gerarResumoChamado(dados, {
      apiKey: 'chave-de-teste',
      requisicao: async () => ({ ok: false, status: 403 }),
    }),
    (error) => {
      assert.ok(error instanceof AssistenteIaErroError)
      assert.equal(error.codigoHttp, 403)
      assert.equal(error.tipo, 'HTTP')
      return true
    },
  )
})

test('falha de rede não registra detalhes da requisição', async () => {
  await assert.rejects(
    gerarResumoChamado(dados, {
      apiKey: 'chave-de-teste',
      requisicao: async () => {
        throw new Error('Falha de rede com chave-de-teste')
      },
    }),
    (error) => {
      assert.ok(error instanceof AssistenteIaErroError)
      assert.equal(error.codigoHttp, null)
      assert.equal(error.tipo, 'REDE')
      return true
    },
  )
})

test('identifica tempo limite sem expor detalhes da requisição', async () => {
  const erroTempoLimite = new Error('A chamada excedeu o limite')
  erroTempoLimite.name = 'TimeoutError'

  await assert.rejects(
    gerarResumoChamado(dados, {
      apiKey: 'chave-de-teste',
      requisicao: async () => {
        throw erroTempoLimite
      },
    }),
    (error) => {
      assert.ok(error instanceof AssistenteIaErroError)
      assert.equal(error.codigoHttp, null)
      assert.equal(error.tipo, 'TEMPO_LIMITE')
      return true
    },
  )
})
