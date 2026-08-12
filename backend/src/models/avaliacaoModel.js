import pool from '../database/db.js'

async function buscarPorChamadoCliente(chamadoId, clienteId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT id, chamado_id, cliente_id, nota, comentario, created_at
      FROM avaliacoes_chamados
      WHERE chamado_id = ? AND cliente_id = ?
    `,
    [chamadoId, clienteId],
  )

  return rows[0] || null
}

async function criar(
  { chamado_id, cliente_id, nota, comentario },
  executor = pool,
) {
  await executor.execute(
    `
      INSERT INTO avaliacoes_chamados (chamado_id, cliente_id, nota, comentario)
      VALUES (?, ?, ?, ?)
    `,
    [chamado_id, cliente_id, nota, comentario || null],
  )

  return buscarPorChamadoCliente(chamado_id, cliente_id, executor)
}

async function listarParaAdministracao(executor = pool) {
  const [rows] = await executor.query(`
    SELECT
      avaliacoes_chamados.id,
      avaliacoes_chamados.chamado_id,
      avaliacoes_chamados.nota,
      avaliacoes_chamados.comentario,
      avaliacoes_chamados.created_at,
      chamados.titulo AS chamado_titulo,
      clientes.nome AS cliente_nome,
      clientes.empresa AS cliente_empresa
    FROM avaliacoes_chamados
    INNER JOIN chamados ON chamados.id = avaliacoes_chamados.chamado_id
    INNER JOIN clientes ON clientes.id = avaliacoes_chamados.cliente_id
    ORDER BY avaliacoes_chamados.created_at DESC, avaliacoes_chamados.id DESC
  `)

  return rows
}

async function obterResumo(executor = pool) {
  const [rows] = await executor.query(`
    SELECT
      COUNT(*) AS total,
      AVG(nota) AS media
    FROM avaliacoes_chamados
  `)

  return {
    total: Number(rows[0]?.total ?? 0),
    media: rows[0]?.media === null ? null : Number(rows[0].media),
  }
}

export default {
  buscarPorChamadoCliente,
  criar,
  listarParaAdministracao,
  obterResumo,
}
