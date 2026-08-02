import chamadoModel from '../models/chamadoModel.js'

async function registrarSeAplicavel(chamadoId, comentario, executor) {
  if (comentario?.tipo !== 'PUBLICO') return false

  if (!comentario.created_at) {
    throw new Error('Comentário público sem data de criação.')
  }

  await chamadoModel.registrarPrimeiraResposta(
    chamadoId,
    comentario.created_at,
    executor,
  )

  return true
}

export default {
  registrarSeAplicavel,
}
