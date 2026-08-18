import crypto from 'node:crypto'
import visitaModel from '../models/visitaModel.js'
import geolocalizacaoService from '../services/geolocalizacaoService.js'
import relatorioService, {
  PeriodoRelatorioInvalidoError,
} from '../services/relatorioService.js'

const PAGINAS_VALIDAS = new Set([
  'login',
  'visao-geral',
  'clientes',
  'chamados',
  'usuarios',
  'relatorios',
  'configuracoes',
])

function identificarDispositivo(userAgent = '') {
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet'
  if (/mobile|android|iphone/i.test(userAgent)) return 'Celular'
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return 'Computador'
  return 'Outro'
}

function normalizarOrigem(origem) {
  if (typeof origem !== 'string' || !origem.trim()) return 'Acesso direto'

  try {
    return new URL(origem).hostname.slice(0, 180) || 'Acesso direto'
  } catch {
    return 'Acesso direto'
  }
}

export function criarVisitasController({
  visitas = visitaModel,
  geolocalizacao = geolocalizacaoService,
} = {}) {
  async function registrar(request, response) {
    const sessaoId = request.body?.sessao_id
    const pagina = request.body?.pagina

    if (
      typeof sessaoId !== 'string' ||
      sessaoId.length < 16 ||
      sessaoId.length > 100 ||
      !/^[a-zA-Z0-9-]+$/.test(sessaoId) ||
      !PAGINAS_VALIDAS.has(pagina)
    ) {
      return response.status(400).json({
        status: 'erro',
        message: 'Dados da visita inválidos.',
      })
    }

    try {
      const sessaoHash = crypto
        .createHash('sha256')
        .update(sessaoId)
        .digest('hex')
      const localizacaoExistente =
        await visitas.buscarLocalizacaoDaSessao(sessaoHash)

      if (!localizacaoExistente) {
        // Diagnóstico temporário: nenhum dado do visitante aqui, só a
        // configuração do servidor, para confirmar se `trust proxy` está
        // extraindo o IP real por trás do proxy de produção.
        console.warn(
          `[diag-visitas] node_env=${process.env.NODE_ENV ?? '(vazio)'} trust_proxy=${request.app.get('trust proxy')} xff_presente=${Boolean(request.headers['x-forwarded-for'])}`,
        )
      }

      const localizacao =
        localizacaoExistente ?? (await geolocalizacao.localizarIp(request.ip))

      await visitas.registrar({
        sessao_hash: sessaoHash,
        pagina,
        pais: localizacao.pais,
        regiao: localizacao.regiao,
        origem: normalizarOrigem(request.body?.origem),
        dispositivo: identificarDispositivo(request.get('user-agent') ?? ''),
      })

      return response.status(204).end()
    } catch (error) {
      console.error('Erro ao registrar estatística de visita:', error)
      return response.status(204).end()
    }
  }

  async function buscarResumo(request, response) {
    try {
      const periodo = relatorioService.normalizarPeriodo(request.query)
      const resumo = await visitas.buscarResumo(
        periodo.data_inicio,
        periodo.data_fim,
      )

      return response.status(200).json({ periodo, ...resumo })
    } catch (error) {
      if (error instanceof PeriodoRelatorioInvalidoError) {
        return response.status(400).json({
          status: 'erro',
          message: error.message,
        })
      }

      console.error('Erro ao buscar estatísticas de visitas:', error)
      return response.status(500).json({
        status: 'erro',
        message: 'Não foi possível carregar as estatísticas de visitas.',
      })
    }
  }

  return { registrar, buscarResumo }
}

export default criarVisitasController()
