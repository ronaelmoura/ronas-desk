import { Router } from 'express'
import pool from '../database/db.js'
import chamadosController from '../controllers/chamadosController.js'

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

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

// GET /api/chamados
// Agora usa Controller → Model → MySQL
chamadosRouter.get('/', chamadosController.listar)

// GET /api/chamados/:id
chamadosRouter.get(
  '/:id',
  chamadosController.buscarPorId,
)


// POST /api/chamados
chamadosRouter.post('/', async (request, response) => {
  const erro = validarChamado(request.body)

  if (erro) {
    return response.status(400).json({
      status: 'erro',
      message: erro,
    })
  }

  const titulo = request.body.titulo.trim()
  const descricao = request.body.descricao.trim()
  const categoria = request.body.categoria
  const prioridade = request.body.prioridade
  const status = request.body.status || 'Aberto'

  try {
    const [resultado] = await pool.execute(
      `
        INSERT INTO chamados (
          titulo,
          descricao,
          categoria,
          prioridade,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        titulo,
        descricao,
        categoria,
        prioridade,
        status,
      ],
    )

    const [chamadosCriados] = await pool.execute(
      `
        SELECT
          id,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
          created_at,
          updated_at
        FROM chamados
        WHERE id = ?
      `,
      [resultado.insertId],
    )

    return response.status(201).json(chamadosCriados[0])
  } catch (error) {
    console.error('Erro ao criar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível criar o chamado.',
    })
  }
})

// PUT /api/chamados/:id
chamadosRouter.put('/:id', async (request, response) => {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  try {
    const [chamadosExistentes] = await pool.execute(
      `
        SELECT
          id,
          titulo,
          descricao,
          categoria,
          prioridade,
          status
        FROM chamados
        WHERE id = ?
      `,
      [id],
    )

    if (chamadosExistentes.length === 0) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    const dadosAtualizados = {
      ...chamadosExistentes[0],
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

    await pool.execute(
      `
        UPDATE chamados
        SET
          titulo = ?,
          descricao = ?,
          categoria = ?,
          prioridade = ?,
          status = ?
        WHERE id = ?
      `,
      [
        dadosAtualizados.titulo.trim(),
        dadosAtualizados.descricao.trim(),
        dadosAtualizados.categoria,
        dadosAtualizados.prioridade,
        dadosAtualizados.status,
        id,
      ],
    )

    const [chamadosAtualizados] = await pool.execute(
      `
        SELECT
          id,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
          created_at,
          updated_at
        FROM chamados
        WHERE id = ?
      `,
      [id],
    )

    return response.status(200).json(
      chamadosAtualizados[0],
    )
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível atualizar o chamado.',
    })
  }
})

// DELETE /api/chamados/:id
chamadosRouter.delete('/:id', async (request, response) => {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  try {
    const [chamadosEncontrados] = await pool.execute(
      `
        SELECT
          id,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
          created_at,
          updated_at
        FROM chamados
        WHERE id = ?
      `,
      [id],
    )

    if (chamadosEncontrados.length === 0) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    await pool.execute(
      'DELETE FROM chamados WHERE id = ?',
      [id],
    )

    return response.status(200).json({
      status: 'sucesso',
      message: 'Chamado excluído com sucesso.',
      chamado: chamadosEncontrados[0],
    })
  } catch (error) {
    console.error('Erro ao excluir chamado:', error)

    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível excluir o chamado.',
    })
  }
})

export default chamadosRouter