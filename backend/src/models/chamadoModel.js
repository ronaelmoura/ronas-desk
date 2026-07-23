import pool from '../database/db.js'

async function listar() {
  const [rows] = await pool.query(`
    SELECT
      chamados.id,
      chamados.cliente_id,
      chamados.responsavel_id,
      clientes.nome AS cliente_nome,
      usuarios.nome AS responsavel_nome,
      chamados.titulo,
      chamados.descricao,
      chamados.categoria,
      chamados.prioridade,
      chamados.status,
      chamados.created_at,
      chamados.updated_at,
      chamados.resolved_at
    FROM chamados
    LEFT JOIN clientes
      ON clientes.id = chamados.cliente_id
    LEFT JOIN usuarios
      ON usuarios.id = chamados.responsavel_id
    ORDER BY chamados.id DESC
  `)

  return rows
}

async function buscarPorId(id, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        chamados.id,
        chamados.cliente_id,
        chamados.responsavel_id,
        clientes.nome AS cliente_nome,
        usuarios.nome AS responsavel_nome,
        chamados.titulo,
        chamados.descricao,
        chamados.categoria,
        chamados.prioridade,
        chamados.status,
        chamados.created_at,
        chamados.updated_at,
        chamados.resolved_at
      FROM chamados
      LEFT JOIN clientes
        ON clientes.id = chamados.cliente_id
      LEFT JOIN usuarios
        ON usuarios.id = chamados.responsavel_id
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

async function buscarResponsavelAtivo(responsavelId) {
  const [rows] = await pool.execute(
    `
      SELECT id, nome
      FROM usuarios
      WHERE id = ?
        AND ativo = TRUE
    `,
    [responsavelId],
  )

  return rows[0] || null
}

async function criar(dados, executor = pool) {
  const {
    cliente_id,
    responsavel_id,
    titulo,
    descricao,
    categoria,
    prioridade,
    status,
    resolved_at,
  } = dados

  const [resultado] = await executor.execute(
    `
      INSERT INTO chamados (
        cliente_id,
        responsavel_id,
        titulo,
        descricao,
        categoria,
        prioridade,
        status,
        resolved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      cliente_id,
      responsavel_id,
      titulo,
      descricao,
      categoria,
      prioridade,
      status,
      resolved_at,
    ],
  )

  return buscarPorId(resultado.insertId, executor)
}

async function atualizar(id, dados, executor = pool) {
  const {
    cliente_id,
    responsavel_id,
    titulo,
    descricao,
    categoria,
    prioridade,
    status,
    resolved_at,
  } = dados

  await executor.execute(
    `
      UPDATE chamados
      SET
        cliente_id = ?,
        responsavel_id = ?,
        titulo = ?,
        descricao = ?,
        categoria = ?,
        prioridade = ?,
        status = ?,
        resolved_at = ?
      WHERE id = ?
    `,
    [
      cliente_id,
      responsavel_id,
      titulo,
      descricao,
      categoria,
      prioridade,
      status,
      resolved_at,
      id,
    ],
  )

  return buscarPorId(id, executor)
}

async function excluir(id, executor = pool) {
  const chamado = await buscarPorId(id, executor)

  if (!chamado) {
    return null
  }

  await executor.execute('DELETE FROM chamados WHERE id = ?', [id])

  return chamado
}

export default {
  listar,
  buscarPorId,
  buscarClienteAtivo,
  buscarResponsavelAtivo,
  criar,
  atualizar,
  excluir,
}
