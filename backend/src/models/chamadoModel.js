import pool from '../database/db.js'

async function listar() {
  const [rows] = await pool.query(`
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
    ORDER BY id DESC
  `)

  return rows
}
async function buscarPorId(id) {
  const [rows] = await pool.execute(
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

  return rows[0] || null
}
export default {
  listar,
  buscarPorId,
}