import pool from '../database/db.js'

async function listarChamadosPorPeriodo(dataInicio, dataFim, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        chamados.id,
        chamados.titulo,
        chamados.categoria,
        chamados.prioridade,
        chamados.status,
        chamados.created_at,
        chamados.updated_at,
        chamados.resolved_at,
        clientes.nome AS cliente_nome,
        usuarios.nome AS responsavel_nome
      FROM chamados
      LEFT JOIN clientes
        ON clientes.id = chamados.cliente_id
      LEFT JOIN usuarios
        ON usuarios.id = chamados.responsavel_id
      WHERE chamados.created_at >= ?
        AND chamados.created_at < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY chamados.created_at DESC, chamados.id DESC
    `,
    [dataInicio, dataFim],
  )

  return rows
}

export default {
  listarChamadosPorPeriodo,
}
