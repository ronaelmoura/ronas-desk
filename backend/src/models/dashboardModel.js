import pool from '../database/db.js'

async function buscarResumo() {
  const [resumoResultado, chamadosRecentesResultado] = await Promise.all([
    pool.query(`
        SELECT
          (SELECT COUNT(*) FROM clientes) AS total_clientes,
          (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
          COUNT(*) AS total_chamados,
          SUM(status = 'Aberto') AS chamados_abertos,
          SUM(status = 'Em andamento') AS chamados_em_andamento,
          SUM(status = 'Concluído') AS chamados_concluidos,
          SUM(prioridade = 'Alta') AS chamados_alta_prioridade
        FROM chamados
      `),
    pool.query(`
        SELECT
          id,
          titulo,
          status,
          prioridade
        FROM chamados
        ORDER BY id DESC
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
    chamados_abertos: Number(resumo.chamados_abertos),
    chamados_em_andamento: Number(resumo.chamados_em_andamento),
    chamados_concluidos: Number(resumo.chamados_concluidos),
    chamados_alta_prioridade: Number(resumo.chamados_alta_prioridade),
    chamados_recentes: chamadosRecentes,
  }
}

export default {
  buscarResumo,
}
