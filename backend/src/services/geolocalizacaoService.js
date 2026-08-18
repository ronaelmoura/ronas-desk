import net from 'node:net'

function normalizarIp(ip = '') {
  const valor = String(ip).trim().split(',')[0].trim()
  return valor.startsWith('::ffff:') ? valor.slice(7) : valor
}

function motivoIpNaoPublico(ip) {
  if (!ip) return 'ausente'
  if (!net.isIP(ip)) return 'formato inválido'
  if (ip === '::1' || ip === '127.0.0.1') return 'loopback'

  if (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80:')
  ) {
    return 'faixa privada'
  }

  return null
}

export async function localizarIp(
  ipRecebido,
  { requisicao = fetch, tempoLimiteMs = 1500 } = {},
) {
  const ip = normalizarIp(ipRecebido)
  const motivo = motivoIpNaoPublico(ip)

  if (motivo) {
    // Nunca logar o IP em si (a demonstração promete não armazená-lo); só o
    // motivo ajuda a diagnosticar se `trust proxy` está mal configurado atrás
    // do proxy de produção sem expor dado nenhum do visitante.
    console.warn(`Geolocalização ignorada: IP ${motivo}.`)
    return { pais: 'Não identificado', regiao: 'Não identificada' }
  }

  try {
    const response = await requisicao(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region`,
      { signal: AbortSignal.timeout(tempoLimiteMs) },
    )

    if (!response.ok) throw new Error('Falha na geolocalização.')
    const dados = await response.json()

    if (!dados.success) throw new Error('Localização indisponível.')

    return {
      pais: dados.country?.trim() || 'Não identificado',
      regiao: dados.region?.trim() || 'Não identificada',
    }
  } catch (error) {
    console.warn('Falha ao consultar serviço de geolocalização:', error.message)
    return { pais: 'Não identificado', regiao: 'Não identificada' }
  }
}

export default { localizarIp }
