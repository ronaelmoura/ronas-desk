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

test('envia contexto limitado e oculta credenciais reconhecíveis', async () => {
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
      assert.equal(error.tipo, 'REDE_OU_TEMPO')
      return true
    },
  )
})
