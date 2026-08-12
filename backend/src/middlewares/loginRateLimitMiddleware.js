import { rateLimit } from 'express-rate-limit'

export function criarLimitadorLogin(
  { windowMs, limit },
  { ignorarSucessos = true } = {},
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: ignorarSucessos,
    handler(request, response) {
      return response.status(429).json({
        status: 'erro',
        message: 'Muitas tentativas de acesso. Tente novamente mais tarde.',
      })
    },
  })
}
