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
        chamados.sla_started_at,
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

export async function gerarRelatorioPaginado(periodo, paginacao, executor = pool) {
  const parametros = [periodo.data_inicio, periodo.data_fim]
  const where = `WHERE chamados.created_at >= ?
    AND chamados.created_at < DATE_ADD(?, INTERVAL 1 DAY)`
  const inicioSla = 'COALESCE(chamados.sla_started_at, chamados.created_at)'
  const limiteSla = `CASE chamados.prioridade
    WHEN 'Crítica' THEN 120 WHEN 'Alta' THEN 480
    WHEN 'Média' THEN 1440 WHEN 'Baixa' THEN 4320 END`
  const minutosSla = `TIMESTAMPDIFF(MINUTE, ${inicioSla}, chamados.resolved_at)`
  const statusSla = `CASE
    WHEN chamados.status IN ('Resolvido', 'Fechado') AND chamados.resolved_at IS NOT NULL THEN
      CASE WHEN (${minutosSla}) >= (${limiteSla}) THEN 'Vencido'
      WHEN (${minutosSla}) >= ((${limiteSla}) * 0.8) THEN 'Próximo do vencimento'
      ELSE 'Dentro do prazo' END
    ELSE NULL END`
  const distribuicao = (campo) => executor.execute(
    `SELECT COALESCE(${campo}, 'Não atribuído') AS rotulo, COUNT(*) AS total
     FROM chamados LEFT JOIN usuarios ON usuarios.id = chamados.responsavel_id
     ${where} GROUP BY ${campo} ORDER BY total DESC, rotulo ASC`,
    parametros,
  )
  const [resumoResultado, statusResultado, prioridadeResultado, categoriaResultado, responsavelResultado, detalhesResultado, totalResultado] = await Promise.all([
    executor.execute(
      `SELECT COUNT(*) AS total_chamados,
        COALESCE(SUM(chamados.status IN ('Novo', 'Em Atendimento', 'Aguardando Cliente')), 0) AS chamados_abertos,
        COALESCE(SUM(chamados.status IN ('Resolvido', 'Fechado')), 0) AS chamados_encerrados,
        COALESCE(SUM(chamados.status = 'Cancelado'), 0) AS chamados_cancelados,
        AVG(CASE WHEN chamados.status IN ('Resolvido', 'Fechado') AND chamados.resolved_at IS NOT NULL THEN (${minutosSla}) END) AS tempo_medio_resolucao_minutos,
        AVG(CASE WHEN chamados.status IN ('Resolvido', 'Fechado') AND chamados.resolved_at IS NOT NULL THEN (${minutosSla}) < (${limiteSla}) END) * 100 AS sla_cumprido_percentual
       FROM chamados ${where}`,
      parametros,
    ),
    distribuicao('chamados.status'),
    distribuicao('chamados.prioridade'),
    distribuicao('chamados.categoria'),
    distribuicao('usuarios.nome'),
    executor.execute(
      `SELECT chamados.id, chamados.titulo, clientes.nome AS cliente_nome,
        usuarios.nome AS responsavel_nome, chamados.categoria, chamados.prioridade,
        chamados.status, chamados.created_at, chamados.resolved_at,
        ${statusSla} AS sla_status
       FROM chamados
       LEFT JOIN clientes ON clientes.id = chamados.cliente_id
       LEFT JOIN usuarios ON usuarios.id = chamados.responsavel_id
       ${where}
       ORDER BY chamados.created_at DESC, chamados.id DESC LIMIT ? OFFSET ?`,
      [...parametros, paginacao.limite, paginacao.offset],
    ),
    executor.execute(`SELECT COUNT(*) AS total FROM chamados ${where}`, parametros),
  ])

  const resumo = resumoResultado[0][0]
  return {
    resumo: {
      total_chamados: Number(resumo.total_chamados ?? 0),
      chamados_abertos: Number(resumo.chamados_abertos ?? 0),
      chamados_encerrados: Number(resumo.chamados_encerrados ?? 0),
      chamados_cancelados: Number(resumo.chamados_cancelados ?? 0),
      sla_cumprido_percentual: resumo.sla_cumprido_percentual === null ? null : Number(Number(resumo.sla_cumprido_percentual).toFixed(2)),
      tempo_medio_resolucao_minutos: resumo.tempo_medio_resolucao_minutos === null ? null : Number(Number(resumo.tempo_medio_resolucao_minutos).toFixed(2)),
    },
    distribuicoes: {
      status: statusResultado[0], prioridade: prioridadeResultado[0], categoria: categoriaResultado[0], responsavel: responsavelResultado[0],
    },
    chamados: detalhesResultado[0],
    total: totalResultado[0][0].total,
  }
}

export default {
  listarChamadosPorPeriodo,
  gerarRelatorioPaginado,
}
