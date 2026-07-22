import pool from '../database/db.js'

async function listar() {
  const [rows] = await pool.query(`
    SELECT
      chamados.id,
      chamados.cliente_id,
      clientes.nome AS cliente_nome,
      chamados.titulo,
      chamados.descricao,
      chamados.categoria,
      chamados.prioridade,
      chamados.status,
      chamados.created_at,
      chamados.updated_at
    FROM chamados
    LEFT JOIN clientes
      ON clientes.id = chamados.cliente_id
    ORDER BY chamados.id DESC
  `)

  return rows
}

async function buscarPorId(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        chamados.id,
        chamados.cliente_id,
        clientes.nome AS cliente_nome,
        chamados.titulo,
        chamados.descricao,
        chamados.categoria,
        chamados.prioridade,
        chamados.status,
        chamados.created_at,
        chamados.updated_at
      FROM chamados
      LEFT JOIN clientes
        ON clientes.id = chamados.cliente_id
      WHERE chamados.id = ?
    `,
    [id],
  )

  return rows[0] || null
}

async function buscarClienteAtivo(clienteId) {
  const [rows] = await pool.execute(
    `
      SELECT id, nome
      FROM clientes
      WHERE id = ?
        AND ativo = TRUE
    `,
    [clienteId],
  )

  return rows[0] || null
}

async function criar(dados) {
  const { cliente_id, titulo, descricao, categoria, prioridade, status } = dados

  const [resultado] = await pool.execute(
    `
      INSERT INTO chamados (
        cliente_id,
        titulo,
        descricao,
        categoria,
        prioridade,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [cliente_id, titulo, descricao, categoria, prioridade, status],
  )

  return buscarPorId(resultado.insertId)
}

async function atualizar(id, dados) {
  const { cliente_id, titulo, descricao, categoria, prioridade, status } = dados

  await pool.execute(
    `
      UPDATE chamados
      SET
        cliente_id = ?,
        titulo = ?,
        descricao = ?,
        categoria = ?,
        prioridade = ?,
        status = ?
      WHERE id = ?
    `,
    [cliente_id, titulo, descricao, categoria, prioridade, status, id],
  )

  return buscarPorId(id)
}

async function excluir(id) {
  const chamado = await buscarPorId(id)

  if (!chamado) {
    return null
  }

  await pool.execute('DELETE FROM chamados WHERE id = ?', [id])

  return chamado
}

export default {
  listar,
  buscarPorId,
  buscarClienteAtivo,
  criar,
  atualizar,
  excluir,
}
