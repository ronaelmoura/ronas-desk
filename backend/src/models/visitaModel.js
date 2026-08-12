import pool from '../database/db.js'

async function buscarLocalizacaoDaSessao(sessaoHash, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT pais, regiao
      FROM visitas
      WHERE sessao_hash = ?
      ORDER BY id ASC
      LIMIT 1
    `,
    [sessaoHash],
  )

  return rows[0] ?? null
}

async function registrar(visita, executor = pool) {
  const [resultado] = await executor.execute(
    `
      INSERT IGNORE INTO visitas (
        sessao_hash,
        pagina,
        pais,
        regiao,
        origem,
        dispositivo
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      visita.sessao_hash,
      visita.pagina,
      visita.pais,
      visita.regiao,
      visita.origem,
      visita.dispositivo,
    ],
  )

  return resultado.affectedRows === 1
}

async function buscarResumo(dataInicio, dataFim, executor = pool) {
  const parametros = [dataInicio, dataFim]
  const filtro = `created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`

  const [
    resumoResultado,
    diasResultado,
    regioesResultado,
    paginasResultado,
    origensResultado,
    dispositivosResultado,
  ] = await Promise.all([
    executor.execute(
      `SELECT COUNT(*) AS total_visitas,
              COUNT(DISTINCT sessao_hash) AS visitantes_unicos
       FROM visitas WHERE ${filtro}`,
      parametros,
    ),
    executor.execute(
      `SELECT DATE(created_at) AS data, COUNT(*) AS total
       FROM visitas WHERE ${filtro}
       GROUP BY DATE(created_at) ORDER BY data ASC`,
      parametros,
    ),
    executor.execute(
      `SELECT pais, regiao, COUNT(DISTINCT sessao_hash) AS total
       FROM visitas WHERE ${filtro}
       GROUP BY pais, regiao ORDER BY total DESC, pais ASC, regiao ASC
       LIMIT 20`,
      parametros,
    ),
    executor.execute(
      `SELECT pagina AS rotulo, COUNT(*) AS total
       FROM visitas WHERE ${filtro}
       GROUP BY pagina ORDER BY total DESC, pagina ASC`,
      parametros,
    ),
    executor.execute(
      `SELECT origem AS rotulo, COUNT(DISTINCT sessao_hash) AS total
       FROM visitas WHERE ${filtro}
       GROUP BY origem ORDER BY total DESC, origem ASC
       LIMIT 10`,
      parametros,
    ),
    executor.execute(
      `SELECT dispositivo AS rotulo, COUNT(DISTINCT sessao_hash) AS total
       FROM visitas WHERE ${filtro}
       GROUP BY dispositivo ORDER BY total DESC, dispositivo ASC`,
      parametros,
    ),
  ])

  const [resumoRows] = resumoResultado
  const [porDia] = diasResultado
  const [porRegiao] = regioesResultado
  const [porPagina] = paginasResultado
  const [porOrigem] = origensResultado
  const [porDispositivo] = dispositivosResultado

  const normalizarTotais = (itens) =>
    itens.map((item) => ({ ...item, total: Number(item.total) }))

  return {
    total_visitas: Number(resumoRows[0]?.total_visitas ?? 0),
    visitantes_unicos: Number(resumoRows[0]?.visitantes_unicos ?? 0),
    por_dia: normalizarTotais(porDia),
    por_regiao: normalizarTotais(porRegiao),
    por_pagina: normalizarTotais(porPagina),
    por_origem: normalizarTotais(porOrigem),
    por_dispositivo: normalizarTotais(porDispositivo),
  }
}

export default {
  buscarLocalizacaoDaSessao,
  registrar,
  buscarResumo,
}
