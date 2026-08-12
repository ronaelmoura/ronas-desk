import assert from 'node:assert/strict'
import test from 'node:test'
import { localizarIp } from '../src/services/geolocalizacaoService.js'

test('não consulta serviço externo para endereço privado', async () => {
  let chamadas = 0
  const resultado = await localizarIp('192.168.1.10', {
    requisicao: async () => {
      chamadas += 1
    },
  })

  assert.equal(chamadas, 0)
  assert.deepEqual(resultado, {
    pais: 'Não identificado',
    regiao: 'Não identificada',
  })
})

test('retorna somente país e região aproximados', async () => {
  const resultado = await localizarIp('8.8.8.8', {
    requisicao: async () => ({
      ok: true,
      async json() {
        return { success: true, country: 'Brasil', region: 'Rio de Janeiro' }
      },
    }),
  })

  assert.deepEqual(resultado, {
    pais: 'Brasil',
    regiao: 'Rio de Janeiro',
  })
})

test('falha de geolocalização não impede o registro anônimo', async () => {
  const resultado = await localizarIp('8.8.8.8', {
    requisicao: async () => {
      throw new Error('indisponível')
    },
  })

  assert.equal(resultado.pais, 'Não identificado')
  assert.equal(resultado.regiao, 'Não identificada')
})
