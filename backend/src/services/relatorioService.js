import { STATUS_FINALIZADOS } from '../config/sla.js'
import slaService from './slaService.js'

const DIA_EM_MS = 24 * 60 * 60 * 1000
const LIMITE_DIAS = 366
const STATUS_ABERTOS = ['Novo', 'Em Atendimento', 'Aguardando Cliente']

const STATUS_PERMITIDOS = [
  'Novo',
  'Em Atendimento',
  'Aguardando Cliente',
  'Resolvido',
  'Fechado',
  'Cancelado',
]
const PRIORIDADES_PERMITIDAS = ['Crítica', 'Alta', 'Média', 'Baixa']
const CATEGORIAS_PERMITIDAS = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']

export class PeriodoRelatorioInvalidoError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PeriodoRelatorioInvalidoError'
  }
}

export class FiltroRelatorioInvalidoError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FiltroRelatorioInvalidoError'
  }
}

export function normalizarFiltros(query = {}) {
  const status = query.status || undefined
  const prioridade = query.prioridade || undefined
  const categoria = query.categoria || undefined

  if (status && !STATUS_PERMITIDOS.includes(status)) {
    throw new FiltroRelatorioInvalidoError('Status inválido.')
  }

  if (prioridade && !PRIORIDADES_PERMITIDAS.includes(prioridade)) {
    throw new FiltroRelatorioInvalidoError('Prioridade inválida.')
  }

  if (categoria && !CATEGORIAS_PERMITIDAS.includes(categoria)) {
    throw new FiltroRelatorioInvalidoError('Categoria inválida.')
  }

  return { status, prioridade, categoria }
}

function formatarData(data) {
  return data.toISOString().slice(0, 10)
}

function converterData(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null
  }

  const data = new Date(`${valor}T00:00:00.000Z`)
  if (Number.isNaN(data.getTime())) {
    return null
  }
  return formatarData(data) === valor ? data : null
}

export function normalizarPeriodo(query = {}, hoje = new Date()) {
  const fimInformado = query.data_fim
  const inicioInformado = query.data_inicio
  const fimPadrao = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()),
  )
  const fim = fimInformado ? converterData(fimInformado) : fimPadrao

  if (!fim) {
    throw new PeriodoRelatorioInvalidoError('Data final inválida.')
  }

  const inicioPadrao = new Date(fim.getTime() - 29 * DIA_EM_MS)
  const inicio = inicioInformado ? converterData(inicioInformado) : inicioPadrao

  if (!inicio) {
    throw new PeriodoRelatorioInvalidoError('Data inicial inválida.')
  }

  if (inicio > fim) {
    throw new PeriodoRelatorioInvalidoError(
      'A data inicial não pode ser posterior à data final.',
    )
  }

  const totalDias = Math.round((fim - inicio) / DIA_EM_MS) + 1
  if (totalDias > LIMITE_DIAS) {
    throw new PeriodoRelatorioInvalidoError(
      `O período máximo permitido é de ${LIMITE_DIAS} dias.`,
    )
  }

  return {
    data_inicio: formatarData(inicio),
    data_fim: formatarData(fim),
    total_dias: totalDias,
  }
}

function agrupar(chamados, obterRotulo) {
  const totais = new Map()

  for (const chamado of chamados) {
    const rotulo = obterRotulo(chamado) || 'Não informado'
    totais.set(rotulo, (totais.get(rotulo) || 0) + 1)
  }

  return [...totais.entries()]
    .map(([rotulo, total]) => ({ rotulo, total }))
    .sort(
      (primeiro, segundo) =>
        segundo.total - primeiro.total ||
        primeiro.rotulo.localeCompare(segundo.rotulo, 'pt-BR'),
    )
}

export function gerarRelatorio(chamados, periodo, agora = new Date()) {
  const chamadosComSla = slaService.enriquecerChamados(chamados, agora)
  const encerrados = chamadosComSla.filter((chamado) =>
    STATUS_FINALIZADOS.includes(chamado.status),
  )
  const encerradosComSla = encerrados.filter((chamado) => chamado.sla)
  const slaCumpridos = encerradosComSla.filter(
    (chamado) => !chamado.sla.isOverdue,
  ).length
  const mediaResolucao = encerradosComSla.length
    ? encerradosComSla.reduce(
        (total, chamado) => total + chamado.sla.elapsedMinutes,
        0,
      ) / encerradosComSla.length
    : null

  return {
    periodo,
    resumo: {
      total_chamados: chamadosComSla.length,
      chamados_abertos: chamadosComSla.filter((chamado) =>
        STATUS_ABERTOS.includes(chamado.status),
      ).length,
      chamados_encerrados: encerrados.length,
      chamados_cancelados: chamadosComSla.filter(
        (chamado) => chamado.status === 'Cancelado',
      ).length,
      sla_cumprido_percentual: encerradosComSla.length
        ? Number(((slaCumpridos / encerradosComSla.length) * 100).toFixed(2))
        : null,
      tempo_medio_resolucao_minutos:
        mediaResolucao === null ? null : Number(mediaResolucao.toFixed(2)),
    },
    distribuicoes: {
      status: agrupar(chamadosComSla, (chamado) => chamado.status),
      prioridade: agrupar(chamadosComSla, (chamado) => chamado.prioridade),
      categoria: agrupar(chamadosComSla, (chamado) => chamado.categoria),
      responsavel: agrupar(
        chamadosComSla,
        (chamado) => chamado.responsavel_nome || 'Não atribuído',
      ),
    },
    chamados: chamadosComSla.map((chamado) => ({
      id: chamado.id,
      titulo: chamado.titulo,
      cliente_nome: chamado.cliente_nome,
      responsavel_nome: chamado.responsavel_nome,
      categoria: chamado.categoria,
      prioridade: chamado.prioridade,
      status: chamado.status,
      created_at: chamado.created_at,
      resolved_at: chamado.resolved_at,
      sla_status: chamado.sla?.status ?? null,
    })),
  }
}

export default {
  normalizarPeriodo,
  normalizarFiltros,
  gerarRelatorio,
}
