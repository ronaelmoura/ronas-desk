import pool from '../database/db.js'

async function registrar(evento, executor = pool) {
  const {
    entidade,
    entidade_id,
    usuario_id,
    acao,
    campo = null,
    valor_anterior = null,
    valor_novo = null,
    descricao,
  } = evento

  await executor.execute(
    `
      INSERT INTO auditoria (
        entidade,
        entidade_id,
        usuario_id,
        acao,
        campo,
        valor_anterior,
        valor_novo,
        descricao
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entidade,
      entidade_id,
      usuario_id,
      acao,
      campo,
      valor_anterior,
      valor_novo,
      descricao,
    ],
  )
}

async function listarPorChamado(chamadoId) {
  const [rows] = await pool.execute(
    `
      SELECT
        auditoria.id,
        auditoria.acao,
        auditoria.campo,
        auditoria.valor_anterior,
        auditoria.valor_novo,
        auditoria.descricao,
        auditoria.created_at,
        usuarios.id AS usuario_id,
        usuarios.nome AS usuario_nome
      FROM auditoria
      LEFT JOIN usuarios
        ON usuarios.id = auditoria.usuario_id
      WHERE auditoria.entidade = 'chamado'
        AND auditoria.entidade_id = ?
      ORDER BY auditoria.created_at ASC, auditoria.id ASC
    `,
    [chamadoId],
  )

  return rows
}

export default {
  registrar,
  listarPorChamado,
}
