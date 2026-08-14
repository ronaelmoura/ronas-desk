import { rateLimit } from 'express-rate-limit'

export function criarLimitadorAssistenteIa({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator(request) {
      return `usuario:${request.usuario.id}`
    },
    handler(request, response) {
      return response.status(429).json({
        status: 'erro',
        message:
          'Você atingiu o limite temporário de resumos com IA. Tente novamente em alguns minutos.',
      })
    },
  })
}
