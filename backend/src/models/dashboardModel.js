import pool from '../database/db.js'

export function criarFiltroPeriodo(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) {
    return {
      clausula: '',
      parametros: [],
    }
  }

  return {
    clausula: `
      WHERE chamados.created_at >= ?
        AND chamados.created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `,
    parametros: [dataInicio, dataFim],
  }
}

export async function buscarResumo(
  dataInicio = null,
  dataFim = null,
  executor = pool,
) {
  const filtroPeriodo = criarFiltroPeriodo(dataInicio, dataFim)

  const [resumoResultado, chamadosRecentesResultado] = await Promise.all([
    executor.execute(
      `
        SELECT
          (SELECT COUNT(*) FROM clientes) AS total_clientes,
          (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
          COUNT(*) AS total_chamados,
          SUM(status = 'Novo') AS chamados_novos,
          SUM(status = 'Em Atendimento') AS chamados_em_atendimento,
          SUM(status = 'Aguardando Cliente') AS chamados_aguardando_cliente,
          SUM(status = 'Resolvido') AS chamados_resolvidos,
          SUM(status = 'Fechado') AS chamados_fechados,
          SUM(status = 'Cancelado') AS chamados_cancelados,
          SUM(prioridade = 'Crítica') AS chamados_criticos
        FROM chamados
        ${filtroPeriodo.clausula}
      `,
      filtroPeriodo.parametros,
    ),
    executor.execute(
      `
        SELECT
          chamados.id,
          chamados.titulo,
          chamados.status,
          chamados.prioridade,
          chamados.created_at,
          chamados.updated_at,
          chamados.resolved_at,
          chamados.first_response_at,
          chamados.sla_started_at,
          usuarios.nome AS responsavel_nome
        FROM chamados
        LEFT JOIN usuarios
          ON usuarios.id = chamados.responsavel_id
        ${filtroPeriodo.clausula}
        ORDER BY chamados.created_at DESC, chamados.id DESC
        LIMIT 5
      `,
      filtroPeriodo.parametros,
    ),
  ])

  const [resumoRows] = resumoResultado
  const [chamadosRecentes] = chamadosRecentesResultado
  const resumo = resumoRows[0]

  return {
    total_clientes: Number(resumo.total_clientes ?? 0),
    total_usuarios: Number(resumo.total_usuarios ?? 0),
    total_chamados: Number(resumo.total_chamados ?? 0),
    chamados_novos: Number(resumo.chamados_novos ?? 0),
    chamados_em_atendimento: Number(resumo.chamados_em_atendimento ?? 0),
    chamados_aguardando_cliente: Number(
      resumo.chamados_aguardando_cliente ?? 0,
    ),
    chamados_resolvidos: Number(resumo.chamados_resolvidos ?? 0),
    chamados_fechados: Number(resumo.chamados_fechados ?? 0),
    chamados_cancelados: Number(resumo.chamados_cancelados ?? 0),
    chamados_criticos: Number(resumo.chamados_criticos ?? 0),
    chamados_recentes: chamadosRecentes,
  }
}

export default {
  buscarResumo,
}
