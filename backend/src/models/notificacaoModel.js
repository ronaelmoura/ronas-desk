import pool from '../database/db.js'

async function criar(dados, executor = pool) {
  const [resultado] = await executor.execute(
    `
      INSERT INTO notificacoes (usuario_id, chamado_id, tipo, titulo, mensagem)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      dados.usuario_id,
      dados.chamado_id ?? null,
      dados.tipo,
      dados.titulo,
      dados.mensagem,
    ],
  )

  return { id: resultado.insertId, ...dados, lida_em: null }
}

async function listarPorUsuario(usuarioId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        notificacoes.id,
        notificacoes.chamado_id,
        notificacoes.tipo,
        notificacoes.titulo,
        notificacoes.mensagem,
        notificacoes.lida_em,
        notificacoes.created_at,
        chamados.titulo AS chamado_titulo
      FROM notificacoes
      LEFT JOIN chamados ON chamados.id = notificacoes.chamado_id
      WHERE notificacoes.usuario_id = ?
      ORDER BY notificacoes.created_at DESC, notificacoes.id DESC
      LIMIT 30
    `,
    [usuarioId],
  )

  return rows
}

async function contarNaoLidas(usuarioId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT COUNT(*) AS total
      FROM notificacoes
      WHERE usuario_id = ? AND lida_em IS NULL
    `,
    [usuarioId],
  )

  return Number(rows[0]?.total ?? 0)
}

async function marcarComoLida(id, usuarioId, executor = pool) {
  const [resultado] = await executor.execute(
    `
      UPDATE notificacoes
      SET lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP)
      WHERE id = ? AND usuario_id = ?
    `,
    [id, usuarioId],
  )

  return resultado.affectedRows > 0
}

async function marcarTodasComoLidas(usuarioId, executor = pool) {
  await executor.execute(
    `
      UPDATE notificacoes
      SET lida_em = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND lida_em IS NULL
    `,
    [usuarioId],
  )
}

export default {
  criar,
  listarPorUsuario,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
}
