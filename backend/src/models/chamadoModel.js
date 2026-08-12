import pool from '../database/db.js'

async function listar(executor = pool) {
  const [rows] = await executor.query(`
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
      chamados.resolved_at,
      chamados.first_response_at
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
        chamados.resolved_at,
        chamados.first_response_at
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

async function listarPorCliente(clienteId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT id, cliente_id, responsavel_id, titulo, descricao, categoria, prioridade, status,
        created_at, updated_at, resolved_at, first_response_at
      FROM chamados
      WHERE cliente_id = ?
      ORDER BY id DESC
    `,
    [clienteId],
  )

  return rows
}

async function buscarPorIdDoCliente(id, clienteId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT id, cliente_id, responsavel_id, titulo, descricao, categoria, prioridade, status,
        created_at, updated_at, resolved_at, first_response_at
      FROM chamados
      WHERE id = ? AND cliente_id = ?
    `,
    [id, clienteId],
  )

  return rows[0] || null
}

async function buscarPorIdParaAtualizacao(id, executor) {
  const [rows] = await executor.execute(
    'SELECT id FROM chamados WHERE id = ? FOR UPDATE',
    [id],
  )

  if (!rows[0]) return null
  return buscarPorId(id, executor)
}

async function buscarClienteAtivo(clienteId, executor = pool) {
  const [rows] = await executor.execute(
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

async function buscarResponsavelAtivo(responsavelId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT id, nome
      FROM usuarios
      WHERE id = ?
        AND ativo = TRUE
        AND is_demo = FALSE
        AND cargo IN ('Administrador', 'Atendente')
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

async function registrarPrimeiraResposta(id, respondidoEm, executor = pool) {
  await executor.execute(
    `
      UPDATE chamados
      SET first_response_at = IF(
        first_response_at IS NULL OR first_response_at > ?,
        ?,
        first_response_at
      )
      WHERE id = ?
    `,
    [respondidoEm, respondidoEm, id],
  )
}

export default {
  listar,
  buscarPorId,
  listarPorCliente,
  buscarPorIdDoCliente,
  buscarPorIdParaAtualizacao,
  buscarClienteAtivo,
  buscarResponsavelAtivo,
  criar,
  atualizar,
  excluir,
  registrarPrimeiraResposta,
}
