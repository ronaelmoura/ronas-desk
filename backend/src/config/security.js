const LOGIN_WINDOW_MS_PADRAO = 15 * 60 * 1000
const LOGIN_MAX_TENTATIVAS_PADRAO = 5

function inteiroPositivo(valor, valorPadrao) {
  const numero = Number.parseInt(valor, 10)

  return Number.isInteger(numero) && numero > 0 ? numero : valorPadrao
}

export function criarConfiguracaoSeguranca(variaveis = process.env) {
  const producao = variaveis.NODE_ENV === 'production'
  const contentSecurityPolicy = {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      ...(producao ? {} : { upgradeInsecureRequests: null }),
    },
  }

  return {
    trustProxy: producao
      ? inteiroPositivo(variaveis.TRUST_PROXY_HOPS, 1)
      : false,
    helmet: { contentSecurityPolicy },
    loginRateLimit: {
      windowMs: inteiroPositivo(
        variaveis.LOGIN_RATE_LIMIT_WINDOW_MS,
        LOGIN_WINDOW_MS_PADRAO,
      ),
      limit: inteiroPositivo(
        variaveis.LOGIN_RATE_LIMIT_MAX,
        LOGIN_MAX_TENTATIVAS_PADRAO,
      ),
    },
  }
}
