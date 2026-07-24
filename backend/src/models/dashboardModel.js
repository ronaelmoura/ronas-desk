import pool from '../database/db.js'

async function buscarResumo() {
  const [resumoResultado, chamadosRecentesResultado] = await Promise.all([
    pool.query(`
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
      `),
    pool.query(`
        SELECT
          chamados.id,
          chamados.titulo,
          chamados.status,
          chamados.prioridade,
          chamados.created_at,
          chamados.updated_at,
          chamados.resolved_at,
          usuarios.nome AS responsavel_nome
        FROM chamados
        LEFT JOIN usuarios
          ON usuarios.id = chamados.responsavel_id
        ORDER BY chamados.id DESC
        LIMIT 5
      `),
  ])

  const [resumoRows] = resumoResultado
  const [chamadosRecentes] = chamadosRecentesResultado
  const resumo = resumoRows[0]

  return {
    total_clientes: Number(resumo.total_clientes),
    total_usuarios: Number(resumo.total_usuarios),
    total_chamados: Number(resumo.total_chamados),
    chamados_novos: Number(resumo.chamados_novos),
    chamados_em_atendimento: Number(resumo.chamados_em_atendimento),
    chamados_aguardando_cliente: Number(resumo.chamados_aguardando_cliente),
    chamados_resolvidos: Number(resumo.chamados_resolvidos),
    chamados_fechados: Number(resumo.chamados_fechados),
    chamados_cancelados: Number(resumo.chamados_cancelados),
    chamados_criticos: Number(resumo.chamados_criticos),
    chamados_recentes: chamadosRecentes,
  }
}

export default {
  buscarResumo,
}
