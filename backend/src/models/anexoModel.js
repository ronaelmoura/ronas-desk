import pool from '../database/db.js'

const CAMPOS_ANEXO = `
  anexos.id,
  anexos.chamado_id,
  anexos.nome_original,
  anexos.mime_type,
  anexos.tamanho_bytes,
  anexos.cloudinary_public_id,
  anexos.cloudinary_asset_id,
  anexos.formato,
  anexos.created_at,
  usuarios.id AS usuario_id,
  usuarios.nome AS usuario_nome
`

async function listarPorChamado(chamadoId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT ${CAMPOS_ANEXO}
      FROM anexos
      LEFT JOIN usuarios
        ON usuarios.id = anexos.usuario_id
      WHERE anexos.chamado_id = ?
      ORDER BY anexos.created_at ASC, anexos.id ASC
    `,
    [chamadoId],
  )

  return rows
}

async function buscarPorId(chamadoId, anexoId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT ${CAMPOS_ANEXO}
      FROM anexos
      LEFT JOIN usuarios
        ON usuarios.id = anexos.usuario_id
      WHERE anexos.chamado_id = ?
        AND anexos.id = ?
    `,
    [chamadoId, anexoId],
  )

  return rows[0] || null
}

async function buscarPorIdParaAtualizacao(chamadoId, anexoId, executor) {
  const [rows] = await executor.execute(
    `
      SELECT id
      FROM anexos
      WHERE chamado_id = ?
        AND id = ?
      FOR UPDATE
    `,
    [chamadoId, anexoId],
  )

  if (!rows[0]) return null
  return buscarPorId(chamadoId, anexoId, executor)
}

async function criar(dados, executor = pool) {
  const [resultado] = await executor.execute(
    `
      INSERT INTO anexos (
        chamado_id,
        usuario_id,
        nome_original,
        mime_type,
        tamanho_bytes,
        cloudinary_public_id,
        cloudinary_asset_id,
        formato
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.chamado_id,
      dados.usuario_id,
      dados.nome_original,
      dados.mime_type,
      dados.tamanho_bytes,
      dados.cloudinary_public_id,
      dados.cloudinary_asset_id,
      dados.formato,
    ],
  )

  return buscarPorId(dados.chamado_id, resultado.insertId, executor)
}

async function excluir(chamadoId, anexoId, executor = pool) {
  const [resultado] = await executor.execute(
    `
      DELETE FROM anexos
      WHERE chamado_id = ?
        AND id = ?
    `,
    [chamadoId, anexoId],
  )

  return resultado.affectedRows > 0
}

async function contarPorChamado(chamadoId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT COUNT(*) AS total FROM anexos WHERE chamado_id = ?',
    [chamadoId],
  )

  return Number(rows[0]?.total ?? 0)
}

export default {
  listarPorChamado,
  buscarPorId,
  buscarPorIdParaAtualizacao,
  criar,
  excluir,
  contarPorChamado,
}
