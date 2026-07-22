import pool from '../database/db.js'

async function buscarPorEmail(email) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        nome,
        email,
        senha_hash,
        cargo,
        ativo
      FROM usuarios
      WHERE email = ?
    `,
    [email],
  )

  return rows[0] || null
}

async function buscarPorId(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        nome,
        email,
        cargo,
        ativo
      FROM usuarios
      WHERE id = ?
    `,
    [id],
  )

  return rows[0] || null
}

async function criar({ nome, email, senha_hash, cargo }) {
  const [resultado] = await pool.execute(
    `
      INSERT INTO usuarios (
        nome,
        email,
        senha_hash,
        cargo
      )
      VALUES (?, ?, ?, ?)
    `,
    [nome, email, senha_hash, cargo],
  )

  return buscarPorId(resultado.insertId)
}

export default {
  buscarPorEmail,
  buscarPorId,
  criar,
}
