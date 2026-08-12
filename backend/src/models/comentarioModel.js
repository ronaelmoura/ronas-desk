import pool from '../database/db.js'

async function listarPorChamado(chamadoId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        comentarios.id,
        comentarios.chamado_id,
        comentarios.conteudo,
        comentarios.tipo,
        comentarios.created_at,
        comentarios.updated_at,
        usuarios.id AS usuario_id,
        usuarios.nome AS usuario_nome,
        usuarios.cargo AS usuario_cargo
      FROM comentarios
      LEFT JOIN usuarios
        ON usuarios.id = comentarios.usuario_id
      WHERE comentarios.chamado_id = ?
      ORDER BY comentarios.created_at ASC, comentarios.id ASC
    `,
    [chamadoId],
  )

  return rows
}

async function criar(
  { chamado_id, usuario_id, conteudo, tipo },
  executor = pool,
) {
  const [resultado] = await executor.execute(
    `
      INSERT INTO comentarios (chamado_id, usuario_id, conteudo, tipo)
      VALUES (?, ?, ?, ?)
    `,
    [chamado_id, usuario_id, conteudo, tipo],
  )

  const [rows] = await executor.execute(
    `
      SELECT
        comentarios.id,
        comentarios.chamado_id,
        comentarios.conteudo,
        comentarios.tipo,
        comentarios.created_at,
        comentarios.updated_at,
        usuarios.id AS usuario_id,
        usuarios.nome AS usuario_nome,
        usuarios.cargo AS usuario_cargo
      FROM comentarios
      LEFT JOIN usuarios
        ON usuarios.id = comentarios.usuario_id
      WHERE comentarios.id = ?
    `,
    [resultado.insertId],
  )

  return rows[0]
}

async function listarPublicosPorChamado(chamadoId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        comentarios.id,
        comentarios.chamado_id,
        comentarios.conteudo,
        comentarios.tipo,
        comentarios.created_at,
        usuarios.nome AS usuario_nome
      FROM comentarios
      LEFT JOIN usuarios ON usuarios.id = comentarios.usuario_id
      WHERE comentarios.chamado_id = ?
        AND comentarios.tipo = 'PUBLICO'
      ORDER BY comentarios.created_at ASC, comentarios.id ASC
    `,
    [chamadoId],
  )

  return rows
}

export default {
  listarPorChamado,
  listarPublicosPorChamado,
  criar,
}
