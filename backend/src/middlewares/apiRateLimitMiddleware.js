import { rateLimit } from 'express-rate-limit'

export function criarLimitadorApi({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(request, response) {
      return response.status(429).json({
        status: 'erro',
        message: 'Muitas requisições. Tente novamente mais tarde.',
      })
    },
  })
}
