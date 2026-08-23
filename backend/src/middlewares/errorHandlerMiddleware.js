export default function errorHandlerMiddleware(error, request, response, next) {
  if (response.headersSent) {
    return next(error)
  }

  console.error('Erro não tratado:', error)

  return response.status(500).json({
    status: 'erro',
    message: 'Erro interno do servidor.',
  })
}
