import assert from 'node:assert/strict'
import test from 'node:test'
import { criarConfiguracaoBanco } from '../src/config/database.js'

test('mantém TLS desativado quando DB_SSL não está habilitado', () => {
  const configuracao = criarConfiguracaoBanco({
    DB_HOST: 'database',
    DB_USER: 'usuario',
    DB_PASSWORD: 'senha',
    DB_NAME: 'ronas_desk',
    DB_PORT: '3306',
  })

  assert.equal(configuracao.ssl, undefined)
  assert.equal(configuracao.multipleStatements, false)
})

test('habilita TLS validado e decodifica certificado em base64', () => {
  const certificado =
    '-----BEGIN CERTIFICATE-----\ncertificado\n-----END CERTIFICATE-----'
  const configuracao = criarConfiguracaoBanco(
    {
      DB_SSL: 'true',
      DB_SSL_CA_BASE64: Buffer.from(certificado).toString('base64'),
    },
    { multipleStatements: true },
  )

  assert.deepEqual(configuracao.ssl, {
    rejectUnauthorized: true,
    ca: certificado,
  })
  assert.equal(configuracao.multipleStatements, true)
})

test('rejeita conteúdo inválido usado como certificado', () => {
  assert.throws(
    () =>
      criarConfiguracaoBanco({
        DB_SSL: 'true',
        DB_SSL_CA_BASE64: Buffer.from('conteudo-invalido').toString('base64'),
      }),
    /certificado válido/,
  )
})
