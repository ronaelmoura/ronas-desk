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
      chamados.first_response_at,
      chamados.sla_started_at
    FROM chamados
    LEFT JOIN clientes
      ON clientes.id = chamados.cliente_id
    LEFT JOIN usuarios
      ON usuarios.id = chamados.responsavel_id
    ORDER BY chamados.id DESC
  `)

  return rows
}

function criarFiltrosListagem(filtros = {}, incluirCliente = false) {
  const clausulas = []
  const parametros = []

  if (incluirCliente) {
    clausulas.push('chamados.cliente_id = ?')
    parametros.push(filtros.cliente_id)
  }

  if (filtros.busca) {
    clausulas.push(`(
      chamados.titulo LIKE ?
      OR chamados.descricao LIKE ?
      OR chamados.categoria LIKE ?
      OR usuarios.nome LIKE ?
    )`)
    const busca = `%${filtros.busca}%`
    parametros.push(busca, busca, busca, busca)
  }

  for (const campo of ['status', 'prioridade', 'categoria']) {
    if (filtros[campo]) {
      clausulas.push(`chamados.${campo} = ?`)
      parametros.push(filtros[campo])
    }
  }

  if (filtros.sla_status) {
    const limiteSla = `CASE chamados.prioridade
      WHEN 'Crítica' THEN 120
      WHEN 'Alta' THEN 480
      WHEN 'Média' THEN 1440
      WHEN 'Baixa' THEN 4320
    END`
    const minutosConsumidos = `TIMESTAMPDIFF(
      MINUTE,
      COALESCE(chamados.sla_started_at, chamados.created_at),
      CASE
        WHEN chamados.status IN ('Resolvido', 'Fechado') THEN chamados.resolved_at
        ELSE NOW()
      END
    )`

    if (filtros.sla_status === 'Vencido') {
      clausulas.push(`(${minutosConsumidos}) >= (${limiteSla})`)
    } else if (filtros.sla_status === 'Próximo do vencimento') {
      clausulas.push(`(${minutosConsumidos}) >= ((${limiteSla}) * 0.8) AND (${minutosConsumidos}) < (${limiteSla})`)
    } else {
      clausulas.push(`(${minutosConsumidos}) < ((${limiteSla}) * 0.8)`)
    }
  }

  if (filtros.data_inicio) {
    clausulas.push('chamados.created_at >= ?')
    parametros.push(filtros.data_inicio)
  }

  if (filtros.data_fim) {
    clausulas.push('chamados.created_at < DATE_ADD(?, INTERVAL 1 DAY)')
    parametros.push(filtros.data_fim)
  }

  return {
    clausula: clausulas.length ? `WHERE ${clausulas.join(' AND ')}` : '',
    parametros,
  }
}

function obterOrdenacao(ordenacao) {
  const ordenacoes = {
    recentes: 'chamados.created_at DESC, chamados.id DESC',
    antigos: 'chamados.created_at ASC, chamados.id ASC',
    prioridade: `FIELD(chamados.prioridade, 'Crítica', 'Alta', 'Média', 'Baixa'), chamados.created_at DESC, chamados.id DESC`,
  }

  return ordenacoes[ordenacao] || ordenacoes.recentes
}

async function listarPaginado(filtros, paginacao, executor = pool) {
  const filtro = criarFiltrosListagem(filtros)
  const [resultado] = await Promise.all([
    executor.execute(
      `
        SELECT
          chamados.id, chamados.cliente_id, chamados.responsavel_id,
          clientes.nome AS cliente_nome, usuarios.nome AS responsavel_nome,
          chamados.titulo, chamados.descricao, chamados.categoria,
          chamados.prioridade, chamados.status, chamados.created_at,
          chamados.updated_at, chamados.resolved_at, chamados.first_response_at,
          chamados.sla_started_at
        FROM chamados
        LEFT JOIN clientes ON clientes.id = chamados.cliente_id
        LEFT JOIN usuarios ON usuarios.id = chamados.responsavel_id
        ${filtro.clausula}
        ORDER BY ${obterOrdenacao(filtros.ordenacao)}
        LIMIT ? OFFSET ?
      `,
      [...filtro.parametros, paginacao.limite, paginacao.offset],
    ),
    executor.execute(
      `
        SELECT COUNT(*) AS total
        FROM chamados
        LEFT JOIN usuarios ON usuarios.id = chamados.responsavel_id
        ${filtro.clausula}
      `,
      filtro.parametros,
    ),
  ])

  return { dados: resultado[0], total: resultado[1][0].total }
}

async function listarPaginadoPorCliente(clienteId, filtros, paginacao, executor = pool) {
  const filtro = criarFiltrosListagem({ ...filtros, cliente_id: clienteId }, true)
  const [resultado] = await Promise.all([
    executor.execute(
      `
        SELECT id, cliente_id, responsavel_id, titulo, descricao, categoria,
          prioridade, status, created_at, updated_at, resolved_at,
          first_response_at, sla_started_at
        FROM chamados
        ${filtro.clausula.replaceAll('usuarios.nome LIKE ?', 'chamados.titulo LIKE ?')}
        ORDER BY ${obterOrdenacao(filtros.ordenacao).replaceAll('chamados.', '')}
        LIMIT ? OFFSET ?
      `,
      [...filtro.parametros, paginacao.limite, paginacao.offset],
    ),
    executor.execute(
      `SELECT COUNT(*) AS total FROM chamados ${filtro.clausula.replaceAll('usuarios.nome LIKE ?', 'chamados.titulo LIKE ?')}`,
      filtro.parametros,
    ),
  ])

  return { dados: resultado[0], total: resultado[1][0].total }
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
        chamados.first_response_at,
        chamados.sla_started_at
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
        created_at, updated_at, resolved_at, first_response_at, sla_started_at
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
        created_at, updated_at, resolved_at, first_response_at, sla_started_at
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
    sla_started_at,
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
        resolved_at,
        sla_started_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      sla_started_at,
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
    sla_started_at,
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
        resolved_at = ?,
        sla_started_at = ?
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
      sla_started_at,
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
  listarPaginado,
  buscarPorId,
  listarPorCliente,
  listarPaginadoPorCliente,
  buscarPorIdDoCliente,
  buscarPorIdParaAtualizacao,
  buscarClienteAtivo,
  buscarResponsavelAtivo,
  criar,
  atualizar,
  excluir,
  registrarPrimeiraResposta,
}
