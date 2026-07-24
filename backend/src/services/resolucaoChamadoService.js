import { STATUS_FINALIZADOS } from '../config/sla.js'

function estaFinalizado(status) {
  return STATUS_FINALIZADOS.includes(status)
}

function determinarResolvedAt(
  statusAnterior,
  statusNovo,
  resolvedAtAtual,
  agora = new Date(),
) {
  const estavaFinalizado = estaFinalizado(statusAnterior)
  const estaFinalizadoAgora = estaFinalizado(statusNovo)

  if (!estaFinalizadoAgora) return null
  if (estavaFinalizado) return resolvedAtAtual || null

  return agora
}

export default {
  estaFinalizado,
  determinarResolvedAt,
}
