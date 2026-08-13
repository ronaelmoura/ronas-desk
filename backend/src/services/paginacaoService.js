const LIMITE_PADRAO = 10
const LIMITE_MAXIMO = 100

export class PaginacaoInvalidaError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaginacaoInvalidaError'
  }
}

function inteiroPositivo(valor, nome, padrao) {
  if (valor === undefined || valor === '') return padrao

  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1) {
    throw new PaginacaoInvalidaError(`${nome} deve ser um número inteiro positivo.`)
  }

  return numero
}

export function normalizarPaginacao(query = {}) {
  const pagina = inteiroPositivo(query.pagina, 'Página', 1)
  const limite = inteiroPositivo(query.limite, 'Limite', LIMITE_PADRAO)

  if (limite > LIMITE_MAXIMO) {
    throw new PaginacaoInvalidaError(
      `Limite deve ser no máximo ${LIMITE_MAXIMO}.`,
    )
  }

  return {
    pagina,
    limite,
    offset: (pagina - 1) * limite,
  }
}

export function criarRespostaPaginada(dados, total, paginacao) {
  const totalSeguro = Number(total ?? 0)
  const totalPaginas = Math.max(1, Math.ceil(totalSeguro / paginacao.limite))

  return {
    dados,
    paginacao: {
      pagina: Math.min(paginacao.pagina, totalPaginas),
      limite: paginacao.limite,
      total: totalSeguro,
      total_paginas: totalPaginas,
    },
  }
}
