import { Router } from 'express'
import chamados from '../data/chamados.js'

const chamadosRouter = Router()

const categoriasPermitidas = [
  'Hardware',
  'Software',
  'Rede',
  'Acesso',
  'Outro',
]

const prioridadesPermitidas = [
  'Baixa',
  'Média',
  'Alta',
]

const statusPermitidos = [
  'Aberto',
  'Em andamento',
  'Concluído',
]

function validarChamado(dados) {
  const {
    titulo,
    descricao,
    categoria,
    prioridade,
    status,
  } = dados

  if (
    !titulo?.trim() ||
    !descricao?.trim() ||
    !categoria ||
    !prioridade
  ) {
    return 'Título, descrição, categoria e prioridade são obrigatórios.'
  }

  if (!categoriasPermitidas.includes(categoria)) {
    return 'Categoria inválida.'
  }

  if (!prioridadesPermitidas.includes(prioridade)) {
    return 'Prioridade inválida.'
  }

  if (status && !statusPermitidos.includes(status)) {
    return 'Status inválido.'
  }

  return null
}

chamadosRouter.get('/', (request, response) => {
  response.status(200).json(chamados)
})

chamadosRouter.get('/:id', (request, response) => {
  const id = Number(request.params.id)

  const chamado = chamados.find(
    (item) => item.id === id,
  )

  if (!chamado) {
    return response.status(404).json({
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  }

  return response.status(200).json(chamado)
})

chamadosRouter.post('/', (request, response) => {
  const erro = validarChamado(request.body)

  if (erro) {
    return response.status(400).json({
      status: 'erro',
      message: erro,
    })
  }

  const maiorId = chamados.reduce(
    (maior, chamado) => Math.max(maior, chamado.id),
    0,
  )

  const novoChamado = {
    id: maiorId + 1,
    titulo: request.body.titulo.trim(),
    descricao: request.body.descricao.trim(),
    categoria: request.body.categoria,
    prioridade: request.body.prioridade,
    status: request.body.status || 'Aberto',
  }

  chamados.unshift(novoChamado)

  return response.status(201).json(novoChamado)
})

chamadosRouter.put('/:id', (request, response) => {
  const id = Number(request.params.id)

  const indice = chamados.findIndex(
    (item) => item.id === id,
  )

  if (indice === -1) {
    return response.status(404).json({
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  }

  const dadosAtualizados = {
    ...chamados[indice],
    ...request.body,
    id,
  }

  const erro = validarChamado(dadosAtualizados)

  if (erro) {
    return response.status(400).json({
      status: 'erro',
      message: erro,
    })
  }

  chamados[indice] = {
    id,
    titulo: dadosAtualizados.titulo.trim(),
    descricao: dadosAtualizados.descricao.trim(),
    categoria: dadosAtualizados.categoria,
    prioridade: dadosAtualizados.prioridade,
    status: dadosAtualizados.status,
  }

  return response.status(200).json(chamados[indice])
})

chamadosRouter.delete('/:id', (request, response) => {
  const id = Number(request.params.id)

  const indice = chamados.findIndex(
    (item) => item.id === id,
  )

  if (indice === -1) {
    return response.status(404).json({
      status: 'erro',
      message: 'Chamado não encontrado.',
    })
  }

  const chamadoRemovido = chamados.splice(
    indice,
    1,
  )[0]

  return response.status(200).json({
    status: 'sucesso',
    message: 'Chamado excluído com sucesso.',
    chamado: chamadoRemovido,
  })
})

export default chamadosRouter