const API_URL = 'http://localhost:3000/api/chamados'

async function tratarResposta(response) {
  let dados = {}

  try {
    dados = await response.json()
  } catch {
    dados = {}
  }

  if (!response.ok) {
    throw new Error(
      dados.message || 'Não foi possível concluir a operação.',
    )
  }

  return dados
}

export async function listarChamadosApi() {
  const response = await fetch(API_URL)
  return tratarResposta(response)
}

export async function criarChamadoApi(dados) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarChamadoApi(id, dados) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function excluirChamadoApi(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  return tratarResposta(response)
}
