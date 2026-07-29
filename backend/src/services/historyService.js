import pool from '../database/db.js'

export const EVENTOS_HISTORICO = Object.freeze({
  CHAMADO_CRIADO: 'CHAMADO_CRIADO',
  CHAMADO_ATUALIZADO: 'CHAMADO_ATUALIZADO',
  STATUS_ALTERADO: 'STATUS_ALTERADO',
  PRIORIDADE_ALTERADA: 'PRIORIDADE_ALTERADA',
  RESPONSAVEL_ALTERADO: 'RESPONSAVEL_ALTERADO',
  CLIENTE_ALTERADO: 'CLIENTE_ALTERADO',
  CHAMADO_RESOLVIDO: 'CHAMADO_RESOLVIDO',
  CHAMADO_FECHADO: 'CHAMADO_FECHADO',
  CHAMADO_REABERTO: 'CHAMADO_REABERTO',
  COMENTARIO_ADICIONADO: 'COMENTARIO_ADICIONADO',
  ANEXO_ADICIONADO: 'ANEXO_ADICIONADO',
  ANEXO_REMOVIDO: 'ANEXO_REMOVIDO',
})

const CAMPOS_GERAIS = ['titulo', 'descricao', 'categoria']
const STATUS_ENCERRADOS = ['Resolvido', 'Fechado']
const STATUS_ABERTOS = ['Novo', 'Em Atendimento', 'Aguardando Cliente']

function valoresIguais(valorAnterior, valorNovo) {
  if (valorAnterior instanceof Date || valorNovo instanceof Date) {
    return new Date(valorAnterior).getTime() === new Date(valorNovo).getTime()
  }

  return valorAnterior === valorNovo
}

function selecionarAlteracoes(anterior, atual, campos) {
  return campos.reduce(
    (alteracoes, campo) => {
      if (!valoresIguais(anterior?.[campo], atual?.[campo])) {
        alteracoes.old_values[campo] = anterior?.[campo] ?? null
        alteracoes.new_values[campo] = atual?.[campo] ?? null
      }

      return alteracoes
    },
    { old_values: {}, new_values: {} },
  )
}

function temValores(valores) {
  return valores && Object.keys(valores).length > 0
}

function normalizarJson(valor) {
  if (valor === null || valor === undefined) return null
  if (typeof valor === 'string') {
    try {
      return JSON.parse(valor)
    } catch {
      return { valor }
    }
  }

  return valor
}

function serializarJson(valor) {
  return temValores(valor) ? JSON.stringify(valor) : null
}

function criarEventoStatus(anterior, atual) {
  if (valoresIguais(anterior.status, atual.status)) return null

  const valores = {
    old_values: { status: anterior.status },
    new_values: { status: atual.status },
  }

  if (atual.status === 'Resolvido') {
    return {
      event_type: EVENTOS_HISTORICO.CHAMADO_RESOLVIDO,
      description: 'Chamado resolvido.',
      ...valores,
    }
  }

  if (atual.status === 'Fechado') {
    return {
      event_type: EVENTOS_HISTORICO.CHAMADO_FECHADO,
      description: 'Chamado fechado.',
      ...valores,
    }
  }

  if (
    STATUS_ENCERRADOS.includes(anterior.status) &&
    STATUS_ABERTOS.includes(atual.status)
  ) {
    return {
      event_type: EVENTOS_HISTORICO.CHAMADO_REABERTO,
      description: 'Chamado reaberto.',
      ...valores,
    }
  }

  return {
    event_type: EVENTOS_HISTORICO.STATUS_ALTERADO,
    description: 'Status alterado.',
    ...valores,
  }
}

export function criarEventosAtualizacao(anterior, atual) {
  const eventos = []
  const eventoStatus = criarEventoStatus(anterior, atual)
  if (eventoStatus) eventos.push(eventoStatus)

  if (!valoresIguais(anterior.prioridade, atual.prioridade)) {
    eventos.push({
      event_type: EVENTOS_HISTORICO.PRIORIDADE_ALTERADA,
      description: 'Prioridade alterada.',
      old_values: { prioridade: anterior.prioridade },
      new_values: { prioridade: atual.prioridade },
    })
  }

  if (!valoresIguais(anterior.responsavel_id, atual.responsavel_id)) {
    eventos.push({
      event_type: EVENTOS_HISTORICO.RESPONSAVEL_ALTERADO,
      description: 'Responsável alterado.',
      old_values: {
        responsavel: {
          id: anterior.responsavel_id,
          nome: anterior.responsavel_nome,
        },
      },
      new_values: {
        responsavel: {
          id: atual.responsavel_id,
          nome: atual.responsavel_nome,
        },
      },
    })
  }

  if (!valoresIguais(anterior.cliente_id, atual.cliente_id)) {
    eventos.push({
      event_type: EVENTOS_HISTORICO.CLIENTE_ALTERADO,
      description: 'Cliente alterado.',
      old_values: {
        cliente: { id: anterior.cliente_id, nome: anterior.cliente_nome },
      },
      new_values: {
        cliente: { id: atual.cliente_id, nome: atual.cliente_nome },
      },
    })
  }

  const alteracoesGerais = selecionarAlteracoes(anterior, atual, CAMPOS_GERAIS)
  if (temValores(alteracoesGerais.old_values)) {
    eventos.push({
      event_type: EVENTOS_HISTORICO.CHAMADO_ATUALIZADO,
      description: 'Informações do chamado atualizadas.',
      ...alteracoesGerais,
    })
  }

  return eventos
}

async function registrar(evento, executor = pool) {
  const {
    ticket_id,
    user_id = null,
    event_type,
    description,
    old_values = null,
    new_values = null,
  } = evento

  if (!ticket_id || !event_type || !description) {
    return null
  }

  const [resultado] = await executor.execute(
    `
      INSERT INTO ticket_history (
        ticket_id,
        user_id,
        event_type,
        description,
        old_values,
        new_values
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      ticket_id,
      user_id,
      event_type,
      description,
      serializarJson(old_values),
      serializarJson(new_values),
    ],
  )

  return { id: resultado.insertId, ...evento }
}

async function registrarCriacao(chamado, usuarioId, executor = pool) {
  return registrar(
    {
      ticket_id: chamado.id,
      user_id: usuarioId,
      event_type: EVENTOS_HISTORICO.CHAMADO_CRIADO,
      description: 'Chamado criado.',
      new_values: {
        titulo: chamado.titulo,
        categoria: chamado.categoria,
        prioridade: chamado.prioridade,
        status: chamado.status,
        cliente: { id: chamado.cliente_id, nome: chamado.cliente_nome },
        responsavel: {
          id: chamado.responsavel_id,
          nome: chamado.responsavel_nome,
        },
      },
    },
    executor,
  )
}

async function registrarAtualizacao(
  anterior,
  atual,
  usuarioId,
  executor = pool,
) {
  const eventos = criarEventosAtualizacao(anterior, atual)

  for (const evento of eventos) {
    await registrar(
      {
        ticket_id: atual.id,
        user_id: usuarioId,
        ...evento,
      },
      executor,
    )
  }

  return eventos
}

async function registrarComentario(
  chamadoId,
  comentario,
  usuarioId,
  executor = pool,
) {
  return registrar(
    {
      ticket_id: chamadoId,
      user_id: usuarioId,
      event_type: EVENTOS_HISTORICO.COMENTARIO_ADICIONADO,
      description: `Comentário ${
        comentario.tipo === 'PUBLICO' ? 'público' : 'interno'
      } adicionado.`,
      new_values: {
        comentario_id: comentario.id,
        tipo: comentario.tipo,
      },
    },
    executor,
  )
}

async function registrarAnexoAdicionado(
  chamadoId,
  anexo,
  usuarioId,
  executor = pool,
) {
  return registrar(
    {
      ticket_id: chamadoId,
      user_id: usuarioId,
      event_type: EVENTOS_HISTORICO.ANEXO_ADICIONADO,
      description: 'Anexo adicionado.',
      new_values: {
        anexo: {
          id: anexo.id,
          nome: anexo.nome_original,
        },
      },
    },
    executor,
  )
}

async function registrarAnexoRemovido(
  chamadoId,
  anexo,
  usuarioId,
  executor = pool,
) {
  return registrar(
    {
      ticket_id: chamadoId,
      user_id: usuarioId,
      event_type: EVENTOS_HISTORICO.ANEXO_REMOVIDO,
      description: 'Anexo removido.',
      old_values: {
        anexo: {
          id: anexo.id,
          nome: anexo.nome_original,
        },
      },
    },
    executor,
  )
}

async function listarPorChamado(chamadoId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        ticket_history.id,
        ticket_history.ticket_id,
        ticket_history.event_type,
        ticket_history.description,
        ticket_history.old_values,
        ticket_history.new_values,
        ticket_history.created_at,
        usuarios.id AS user_id,
        usuarios.nome AS user_name
      FROM ticket_history
      LEFT JOIN usuarios
        ON usuarios.id = ticket_history.user_id
      WHERE ticket_history.ticket_id = ?
      ORDER BY ticket_history.created_at ASC, ticket_history.id ASC
    `,
    [chamadoId],
  )

  return rows.map((row) => ({
    ...row,
    old_values: normalizarJson(row.old_values),
    new_values: normalizarJson(row.new_values),
  }))
}

export default {
  registrar,
  registrarCriacao,
  registrarAtualizacao,
  registrarComentario,
  registrarAnexoAdicionado,
  registrarAnexoRemovido,
  listarPorChamado,
}
