import net from 'node:net'

function normalizarIp(ip = '') {
  const valor = String(ip).trim().split(',')[0].trim()
  return valor.startsWith('::ffff:') ? valor.slice(7) : valor
}

function ipPrivado(ip) {
  if (!net.isIP(ip)) return true
  if (ip === '::1' || ip === '127.0.0.1') return true

  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80:')
  )
}

export async function localizarIp(
  ipRecebido,
  { requisicao = fetch, tempoLimiteMs = 1500 } = {},
) {
  const ip = normalizarIp(ipRecebido)

  if (ipPrivado(ip)) {
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
  } catch {
    return { pais: 'Não identificado', regiao: 'Não identificada' }
  }
}

export default { localizarIp }
