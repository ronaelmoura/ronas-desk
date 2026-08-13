import pool from '../database/db.js'

const camposCliente = `
  id,
  nome,
  email,
  telefone,
  empresa,
  ativo,
  created_at,
  updated_at
`

function normalizarCliente(cliente) {
  if (!cliente) {
    return null
  }

  return {
    ...cliente,
    ativo: Boolean(cliente.ativo),
  }
}

async function listar() {
  const [rows] = await pool.query(`
    SELECT ${camposCliente}
    FROM clientes
    WHERE ativo = TRUE
    ORDER BY id DESC
  `)

  return rows.map(normalizarCliente)
}

async function listarPaginado({ busca = '' }, paginacao) {
  const clausulaBusca = busca
    ? 'AND (nome LIKE ? OR email LIKE ? OR empresa LIKE ?)'
    : ''
  const parametrosBusca = busca ? [`%${busca}%`, `%${busca}%`, `%${busca}%`] : []

  const [resultado] = await Promise.all([
    pool.execute(
      `
        SELECT ${camposCliente}
        FROM clientes
        WHERE ativo = TRUE ${clausulaBusca}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `,
      [...parametrosBusca, paginacao.limite, paginacao.offset],
    ),
    pool.execute(
      `SELECT COUNT(*) AS total FROM clientes WHERE ativo = TRUE ${clausulaBusca}`,
      parametrosBusca,
    ),
  ])

  return {
    dados: resultado[0].map(normalizarCliente),
    total: resultado[1][0].total,
  }
}

async function buscarPorIdInterno(id, somenteAtivos = true) {
  const filtroAtivo = somenteAtivos ? ' AND ativo = TRUE' : ''

  const [rows] = await pool.execute(
    `
      SELECT ${camposCliente}
      FROM clientes
      WHERE id = ?${filtroAtivo}
    `,
    [id],
  )

  return normalizarCliente(rows[0])
}

async function buscarPorId(id) {
  return buscarPorIdInterno(id)
}

async function buscarChamados(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        titulo,
        categoria,
        prioridade,
        status,
        created_at,
        updated_at,
        resolved_at
      FROM chamados
      WHERE cliente_id = ?
      ORDER BY id DESC
    `,
    [id],
  )

  return rows
}

async function criar(dados) {
  const [resultado] = await pool.execute(
    `
      INSERT INTO clientes (
        nome,
        email,
        telefone,
        empresa,
        ativo
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [dados.nome, dados.email, dados.telefone, dados.empresa, dados.ativo],
  )

  return buscarPorIdInterno(resultado.insertId, false)
}

async function atualizar(id, dados) {
  const [resultado] = await pool.execute(
    `
      UPDATE clientes
      SET
        nome = ?,
        email = ?,
        telefone = ?,
        empresa = ?,
        ativo = ?
      WHERE id = ? AND ativo = TRUE
    `,
    [dados.nome, dados.email, dados.telefone, dados.empresa, dados.ativo, id],
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorIdInterno(id, false)
}

async function desativar(id) {
  const [resultado] = await pool.execute(
    `
      UPDATE clientes
      SET ativo = FALSE
      WHERE id = ? AND ativo = TRUE
    `,
    [id],
  )

  return resultado.affectedRows > 0
}

export default {
  listar,
  listarPaginado,
  buscarPorId,
  buscarChamados,
  criar,
  atualizar,
  desativar,
}
