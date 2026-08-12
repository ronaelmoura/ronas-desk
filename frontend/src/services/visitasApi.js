import apiClient from './apiClient'

const CHAVE_SESSAO_VISITA = 'ronas-desk-visit-session'

function obterSessaoVisita() {
  let sessao = sessionStorage.getItem(CHAVE_SESSAO_VISITA)

  if (!sessao) {
    sessao = crypto.randomUUID()
    sessionStorage.setItem(CHAVE_SESSAO_VISITA, sessao)
  }

  return sessao
}

export async function registrarVisitaApi(pagina) {
  await apiClient.post('/visitas', {
    sessao_id: obterSessaoVisita(),
    pagina,
    origem: document.referrer,
  })
}

export async function buscarResumoVisitasApi(dataInicio, dataFim) {
  const response = await apiClient.get('/visitas/resumo', {
    params: { data_inicio: dataInicio, data_fim: dataFim },
  })

  return response.data
}
