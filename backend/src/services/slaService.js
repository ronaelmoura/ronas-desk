import {
  PERCENTUAL_PROXIMO_VENCIMENTO,
  SLA_PADRAO_MINUTOS,
  STATUS_FINALIZADOS,
  STATUS_SLA,
} from '../config/sla.js'

const MINUTO_EM_MS = 60 * 1000

export class PrioridadeSlaInvalidaError extends Error {
  constructor(prioridade) {
    super(`Prioridade sem configuração de SLA: ${prioridade || '(vazia)'}.`)
    this.name = 'PrioridadeSlaInvalidaError'
  }
}

function converterData(valor) {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function obterLimiteMinutos(chamado) {
  // Ponto único de extensão para regras futuras por empresa, categoria ou tipo.
  const limite = SLA_PADRAO_MINUTOS[chamado?.prioridade]

  if (!limite) {
    throw new PrioridadeSlaInvalidaError(chamado?.prioridade)
  }

  return limite
}

function obterReferenciaFinal(chamado, agora) {
  if (!STATUS_FINALIZADOS.includes(chamado.status)) return agora
  return converterData(chamado.resolved_at)
}

function calcular(chamado, agora = new Date()) {
  const inicio = converterData(chamado?.created_at)
  const dataAtual = converterData(agora)

  if (!inicio || !dataAtual) return null

  const limitMinutes = obterLimiteMinutos(chamado)
  const referenciaFinal = obterReferenciaFinal(chamado, dataAtual)
  if (!referenciaFinal) return null
  const elapsedMinutes = Math.max(
    0,
    (referenciaFinal.getTime() - inicio.getTime()) / MINUTO_EM_MS,
  )
  const remainingMinutes = limitMinutes - elapsedMinutes
  const percentage = (elapsedMinutes / limitMinutes) * 100

  let status = STATUS_SLA.DENTRO_DO_PRAZO
  if (percentage >= 100) status = STATUS_SLA.VENCIDO
  else if (percentage >= PERCENTUAL_PROXIMO_VENCIMENTO) {
    status = STATUS_SLA.PROXIMO_DO_VENCIMENTO
  }

  return {
    limitMinutes,
    elapsedMinutes: Number(elapsedMinutes.toFixed(2)),
    remainingMinutes: Number(remainingMinutes.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
    displayPercentage: Number(
      Math.min(100, Math.max(0, percentage)).toFixed(2),
    ),
    status,
    dueAt: new Date(
      inicio.getTime() + limitMinutes * MINUTO_EM_MS,
    ).toISOString(),
    isOverdue: percentage >= 100,
    isResolved: STATUS_FINALIZADOS.includes(chamado.status),
  }
}

function enriquecerChamado(chamado, agora = new Date()) {
  return chamado ? { ...chamado, sla: calcular(chamado, agora) } : null
}

function enriquecerChamados(chamados, agora = new Date()) {
  return chamados.map((chamado) => enriquecerChamado(chamado, agora))
}

function filtrarPorStatus(chamados, statusSla, agora = new Date()) {
  const enriquecidos = enriquecerChamados(chamados, agora)
  if (!statusSla) return enriquecidos

  if (!Object.values(STATUS_SLA).includes(statusSla)) {
    const erro = new Error('Status de SLA inválido.')
    erro.name = 'StatusSlaInvalidoError'
    throw erro
  }

  return enriquecidos.filter((chamado) => chamado.sla?.status === statusSla)
}

function calcularTempoPrimeiraResposta(chamado) {
  const inicio = converterData(chamado?.created_at)
  const primeiraResposta = converterData(chamado?.first_response_at)

  if (!inicio || !primeiraResposta || primeiraResposta < inicio) return null

  return Number(
    ((primeiraResposta.getTime() - inicio.getTime()) / MINUTO_EM_MS).toFixed(2),
  )
}

function calcularIndicadoresDashboard(chamados, agora = new Date()) {
  const chamadosComSla = enriquecerChamados(chamados, agora)
  const ativos = chamadosComSla.filter(
    (chamado) => chamado.sla && !chamado.sla.isResolved,
  )
  const resolvidos = chamadosComSla.filter((chamado) => chamado.sla?.isResolved)

  const mediaResolucao = resolvidos.length
    ? resolvidos.reduce(
        (total, chamado) => total + chamado.sla.elapsedMinutes,
        0,
      ) / resolvidos.length
    : null
  const temposPrimeiraResposta = chamadosComSla
    .map(calcularTempoPrimeiraResposta)
    .filter((tempo) => tempo !== null)
  const mediaPrimeiraResposta = temposPrimeiraResposta.length
    ? temposPrimeiraResposta.reduce((total, tempo) => total + tempo, 0) /
      temposPrimeiraResposta.length
    : null

  return {
    sla_vencidos: ativos.filter(
      (chamado) => chamado.sla?.status === STATUS_SLA.VENCIDO,
    ).length,
    sla_proximos_vencimento: ativos.filter(
      (chamado) => chamado.sla?.status === STATUS_SLA.PROXIMO_DO_VENCIMENTO,
    ).length,
    tempo_medio_resolucao_minutos:
      mediaResolucao === null ? null : Number(mediaResolucao.toFixed(2)),
    tempo_medio_primeira_resposta_minutos:
      mediaPrimeiraResposta === null
        ? null
        : Number(mediaPrimeiraResposta.toFixed(2)),
  }
}

export default {
  calcular,
  obterLimiteMinutos,
  enriquecerChamado,
  enriquecerChamados,
  filtrarPorStatus,
  calcularIndicadoresDashboard,
}
