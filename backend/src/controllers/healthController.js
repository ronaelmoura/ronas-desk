export function criarHealthController(database) {
  return async function health(request, response) {
    try {
      await database.query('SELECT 1')

      return response.status(200).json({
        status: 'ok',
      })
    } catch (error) {
      console.error(
        'Falha na verificação de saúde:',
        error?.code || 'erro_desconhecido',
      )

      return response.status(503).json({
        status: 'indisponivel',
        message: 'Serviço temporariamente indisponível.',
      })
    }
  }
}
