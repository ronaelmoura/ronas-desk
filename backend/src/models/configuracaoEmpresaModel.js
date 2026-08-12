import pool from '../database/db.js'

const CAMPOS = `
  nome_empresa,
  nome_central,
  logo_url,
  cor_primaria,
  cor_sidebar,
  mensagem_boas_vindas,
  updated_at
`

async function buscar(executor = pool) {
  const [rows] = await executor.execute(
    `SELECT ${CAMPOS} FROM configuracao_empresa WHERE id = 1`,
  )

  return rows[0] ?? null
}

async function atualizar(dados, executor = pool) {
  await executor.execute(
    `
      UPDATE configuracao_empresa
      SET nome_empresa = ?,
          nome_central = ?,
          logo_url = ?,
          cor_primaria = ?,
          cor_sidebar = ?,
          mensagem_boas_vindas = ?
      WHERE id = 1
    `,
    [
      dados.nome_empresa,
      dados.nome_central,
      dados.logo_url,
      dados.cor_primaria,
      dados.cor_sidebar,
      dados.mensagem_boas_vindas,
    ],
  )

  return buscar(executor)
}

export default { buscar, atualizar }
