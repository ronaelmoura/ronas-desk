import jwt from 'jsonwebtoken'

export default function authMiddleware(request, response, next) {
  const authorization = request.headers.authorization
  const [tipo, token] = authorization?.split(' ') ?? []

  if (tipo !== 'Bearer' || !token || !process.env.JWT_SECRET) {
    return response.status(401).json({
      status: 'erro',
      message: 'Token ausente, inválido ou expirado.',
    })
  }

  try {
    const dadosToken = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    })

    if (
      typeof dadosToken !== 'object' ||
      !Number.isInteger(dadosToken.id) ||
      dadosToken.id <= 0
    ) {
      throw new Error('Payload inválido.')
    }

    request.usuario = {
      id: dadosToken.id,
      nome: dadosToken.nome,
      email: dadosToken.email,
      cargo: dadosToken.cargo,
      cliente_id: dadosToken.cliente_id ?? null,
    }

    return next()
  } catch {
    return response.status(401).json({
      status: 'erro',
      message: 'Token ausente, inválido ou expirado.',
    })
  }
}
