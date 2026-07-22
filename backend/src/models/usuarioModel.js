import pool from '../database/db.js'

const camposPublicos = `
  id,
  nome,
  email,
  cargo,
  ativo,
  created_at,
  updated_at
`

function normalizarUsuario(usuario) {
  if (!usuario) {
    return null
  }

  return {
    ...usuario,
    ativo: Boolean(usuario.ativo),
  }
}

async function listar() {
  const [rows] = await pool.query(`
    SELECT ${camposPublicos}
    FROM usuarios
    ORDER BY nome ASC, id ASC
  `)

  return rows.map(normalizarUsuario)
}

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

  return normalizarUsuario(rows[0])
}

async function buscarPorId(id) {
  const [rows] = await pool.execute(
    `
      SELECT ${camposPublicos}
      FROM usuarios
      WHERE id = ?
    `,
    [id],
  )

  return normalizarUsuario(rows[0])
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

async function atualizar(id, { nome, email, senha_hash, cargo }) {
  const campos = ['nome = ?', 'email = ?', 'cargo = ?']
  const valores = [nome, email, cargo]

  if (senha_hash) {
    campos.push('senha_hash = ?')
    valores.push(senha_hash)
  }

  valores.push(id)

  const [resultado] = await pool.execute(
    `
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id = ?
    `,
    valores,
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorId(id)
}

async function alterarStatus(id, ativo) {
  const [resultado] = await pool.execute(
    `
      UPDATE usuarios
      SET ativo = ?
      WHERE id = ?
    `,
    [ativo, id],
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorId(id)
}

async function excluir(id) {
  const [resultado] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [
    id,
  ])

  return resultado.affectedRows > 0
}

export default {
  listar,
  buscarPorEmail,
  buscarPorId,
  criar,
  atualizar,
  alterarStatus,
  excluir,
}
