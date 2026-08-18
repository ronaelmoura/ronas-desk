const LOGIN_WINDOW_MS_PADRAO = 15 * 60 * 1000
const LOGIN_MAX_TENTATIVAS_PADRAO = 5
const IA_WINDOW_MS_PADRAO = 15 * 60 * 1000
const IA_MAX_RESUMOS_PADRAO = 5
const API_WINDOW_MS_PADRAO = 15 * 60 * 1000
const API_MAX_REQUISICOES_PADRAO = 300

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
    assistenteIaRateLimit: {
      windowMs: inteiroPositivo(
        variaveis.IA_RATE_LIMIT_WINDOW_MS,
        IA_WINDOW_MS_PADRAO,
      ),
      limit: inteiroPositivo(
        variaveis.IA_RATE_LIMIT_MAX,
        IA_MAX_RESUMOS_PADRAO,
      ),
    },
    apiRateLimit: {
      windowMs: inteiroPositivo(
        variaveis.API_RATE_LIMIT_WINDOW_MS,
        API_WINDOW_MS_PADRAO,
      ),
      limit: inteiroPositivo(
        variaveis.API_RATE_LIMIT_MAX,
        API_MAX_REQUISICOES_PADRAO,
      ),
    },
  }
}
