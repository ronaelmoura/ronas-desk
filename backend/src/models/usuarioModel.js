import pool from '../database/db.js'
import { criarClausulaPaginacao } from '../services/paginacaoService.js'

const camposPublicos = `
  id,
  nome,
  email,
  cargo,
  cliente_id,
  ativo,
  is_demo,
  created_at,
  updated_at
`

function normalizarUsuario(usuario) {
  if (!usuario) {
    return null
  }

  return {
    ...usuario,
    ativo: Boolean(usuario.ativo),
    is_demo: Boolean(usuario.is_demo),
    cliente_id: usuario.cliente_id ?? null,
  }
}

async function listar() {
  const [rows] = await pool.query(`
    SELECT ${camposPublicos}
    FROM usuarios
    ORDER BY nome ASC, id ASC
  `)

  return rows.map(normalizarUsuario)
}

async function listarPaginado({ busca = '' }, paginacao) {
  const clausulaBusca = busca ? 'WHERE nome LIKE ? OR email LIKE ?' : ''
  const parametrosBusca = busca ? [`%${busca}%`, `%${busca}%`] : []
  const clausulaPaginacao = criarClausulaPaginacao(paginacao)
  const [resultadoDados, resultadoTotal] = await Promise.all([
    pool.execute(
      `
        SELECT ${camposPublicos}
        FROM usuarios
        ${clausulaBusca}
        ORDER BY nome ASC, id ASC
        ${clausulaPaginacao}
      `,
      parametrosBusca,
    ),
    pool.execute(
      `SELECT COUNT(*) AS total FROM usuarios ${clausulaBusca}`,
      parametrosBusca,
    ),
  ])

  return {
    dados: resultadoDados[0].map(normalizarUsuario),
    total: resultadoTotal[0][0].total,
  }
}

async function buscarPorEmail(email) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        nome,
        email,
        senha_hash,
        cargo,
        cliente_id,
        ativo,
        is_demo
      FROM usuarios
      WHERE email = ?
    `,
    [email],
  )

  return normalizarUsuario(rows[0])
}

async function buscarDemoAtivo() {
  const [rows] = await pool.query(`
    SELECT ${camposPublicos}
    FROM usuarios
    WHERE is_demo = 1
      AND ativo = 1
    ORDER BY id ASC
    LIMIT 1
  `)

  return normalizarUsuario(rows[0])
}

async function buscarPorId(id, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT ${camposPublicos}
      FROM usuarios
      WHERE id = ?
    `,
    [id],
  )

  return normalizarUsuario(rows[0])
}

async function buscarPorClienteId(clienteId, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT ${camposPublicos}
      FROM usuarios
      WHERE cliente_id = ?
    `,
    [clienteId],
  )

  return normalizarUsuario(rows[0])
}

async function listarEquipeAtiva(executor = pool) {
  const [rows] = await executor.query(`
    SELECT ${camposPublicos}
    FROM usuarios
    WHERE ativo = 1
      AND is_demo = 0
      AND cargo IN ('Administrador', 'Atendente')
    ORDER BY id ASC
  `)

  return rows.map(normalizarUsuario)
}

async function buscarPorIdComSenha(id, executor = pool) {
  const [rows] = await executor.execute(
    `
      SELECT
        id,
        nome,
        email,
        senha_hash,
        cargo,
        cliente_id,
        ativo
      FROM usuarios
      WHERE id = ?
    `,
    [id],
  )

  return normalizarUsuario(rows[0])
}

async function criar({
  nome,
  email,
  senha_hash,
  cargo,
  cliente_id = null,
  is_demo = false,
}) {
  const [resultado] = await pool.execute(
    `
      INSERT INTO usuarios (
        nome,
        email,
        senha_hash,
        cargo,
        cliente_id,
        is_demo
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [nome, email, senha_hash, cargo, cliente_id, is_demo],
  )

  return buscarPorId(resultado.insertId)
}

async function atualizar(
  id,
  { nome, email, senha_hash, cargo, cliente_id = null },
) {
  const campos = ['nome = ?', 'email = ?', 'cargo = ?', 'cliente_id = ?']
  const valores = [nome, email, cargo, cliente_id]

  if (senha_hash) {
    campos.push('senha_hash = ?')
    valores.push(senha_hash)
  }

  valores.push(id)

  const [resultado] = await pool.execute(
    `
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id = ?
    `,
    valores,
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorId(id)
}

async function atualizarPerfil(id, { nome, email }, executor = pool) {
  const [resultado] = await executor.execute(
    `
      UPDATE usuarios
      SET nome = ?, email = ?
      WHERE id = ?
        AND ativo = 1
    `,
    [nome, email, id],
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorId(id, executor)
}

async function alterarStatus(id, ativo) {
  const [resultado] = await pool.execute(
    `
      UPDATE usuarios
      SET ativo = ?
      WHERE id = ?
    `,
    [ativo, id],
  )

  if (resultado.affectedRows === 0) {
    return null
  }

  return buscarPorId(id)
}

async function atualizarSenhaPorEmail(email, senha_hash, executor = pool) {
  const [resultado] = await executor.execute(
    `
      UPDATE usuarios
      SET senha_hash = ?
      WHERE email = ?
        AND ativo = 1
    `,
    [senha_hash, email],
  )

  return resultado.affectedRows > 0
}

async function atualizarSenhaPorId(id, senha_hash, executor = pool) {
  const [resultado] = await executor.execute(
    `
      UPDATE usuarios
      SET senha_hash = ?
      WHERE id = ?
        AND ativo = 1
    `,
    [senha_hash, id],
  )

  return resultado.affectedRows > 0
}

async function excluir(id) {
  const [resultado] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [
    id,
  ])

  return resultado.affectedRows > 0
}

export default {
  listar,
  listarPaginado,
  buscarPorEmail,
  buscarDemoAtivo,
  buscarPorId,
  buscarPorClienteId,
  listarEquipeAtiva,
  buscarPorIdComSenha,
  criar,
  atualizar,
  atualizarPerfil,
  alterarStatus,
  atualizarSenhaPorEmail,
  atualizarSenhaPorId,
  excluir,
}
