function valorBooleano(valor) {
  return ['1', 'true', 'yes', 'on'].includes(String(valor).toLowerCase())
}

function criarConfiguracaoSsl(variaveis) {
  if (!valorBooleano(variaveis.DB_SSL)) {
    return undefined
  }

  const configuracaoSsl = {
    rejectUnauthorized: true,
  }

  if (variaveis.DB_SSL_CA_BASE64) {
    const certificado = Buffer.from(
      variaveis.DB_SSL_CA_BASE64,
      'base64',
    ).toString('utf8')

    if (!certificado.includes('-----BEGIN CERTIFICATE-----')) {
      throw new Error('DB_SSL_CA_BASE64 não contém um certificado válido.')
    }

    configuracaoSsl.ca = certificado
  }

  return configuracaoSsl
}

export function criarConfiguracaoBanco(
  variaveis = process.env,
  { multipleStatements = false } = {},
) {
  return {
    host: variaveis.DB_HOST,
    user: variaveis.DB_USER,
    password: variaveis.DB_PASSWORD,
    database: variaveis.DB_NAME,
    port: Number(variaveis.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements,
    ssl: criarConfiguracaoSsl(variaveis),
  }
}
