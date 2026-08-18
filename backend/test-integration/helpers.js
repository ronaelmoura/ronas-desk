// Utilitários compartilhados pelos testes de integração.
//
// Diferente dos testes em backend/test/, estes arquivos NÃO usam mocks: eles
// batem em um MySQL real (definido pelas variáveis DB_* do ambiente) rodando
// as migrations reais de backend/sql/. Por isso ficam fora de backend/test/
// e só rodam com `npm run test:integration`, nunca com `npm test`.
//
// Proteção deliberada: helpers.js recusa rodar se DB_NAME não terminar em
// "_test", para reduzir o risco de truncar um banco de verdade por engano.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
  throw new Error(
    'Os testes de integração só podem rodar contra um banco cujo DB_NAME termine em "_test". ' +
      `DB_NAME atual: ${process.env.DB_NAME || '(vazio)'}.`,
  )
}

const { default: pool } = await import('../src/database/db.js')
const { criarApp } = await import('../src/app.js')

const TABELAS_PARA_LIMPAR = [
  'ticket_history',
  'avaliacoes_chamados',
  'comentarios',
  'anexos',
  'notificacoes',
  'auditoria',
  'visitas',
  'chamados',
  'clientes',
  'configuracao_empresa',
  'usuarios',
]

export async function limparBanco() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const tabela of TABELAS_PARA_LIMPAR) {
    await pool.query(`TRUNCATE TABLE ${tabela}`)
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')
}

export async function fecharPool() {
  await pool.end()
}

// Custo baixo de propósito: só usado em fixtures de teste contra um banco
// descartável, nunca em produção. Acelera a criação de muitos usuários.
const CUSTO_BCRYPT_TESTE = 4

export async function criarUsuario({
  nome = 'Usuário de Teste',
  email,
  senha = 'senha-valida-123',
  cargo = 'Administrador',
  cliente_id = null,
  ativo = true,
  is_demo = false,
} = {}) {
  const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT_TESTE)
  const [resultado] = await pool.execute(
    `INSERT INTO usuarios (nome, email, senha_hash, cargo, cliente_id, ativo, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nome, email, senhaHash, cargo, cliente_id, ativo ? 1 : 0, is_demo ? 1 : 0],
  )

  return {
    id: resultado.insertId,
    nome,
    email,
    senha,
    cargo,
    cliente_id,
    ativo,
    is_demo,
  }
}

export async function criarCliente({
  nome = 'Cliente de Teste',
  email,
  telefone = '(11) 90000-0000',
  empresa = 'Empresa de Teste',
  ativo = true,
} = {}) {
  const [resultado] = await pool.execute(
    `INSERT INTO clientes (nome, email, telefone, empresa, ativo)
     VALUES (?, ?, ?, ?, ?)`,
    [nome, email, telefone, empresa, ativo ? 1 : 0],
  )

  return { id: resultado.insertId, nome, email, telefone, empresa, ativo }
}

export async function criarChamado({
  cliente_id,
  responsavel_id = null,
  titulo = 'Chamado de teste',
  descricao = 'Descrição do chamado de teste.',
  categoria = 'Software',
  prioridade = 'Média',
  status = 'Novo',
  created_at = new Date(),
  resolved_at = null,
  first_response_at = null,
  sla_started_at = null,
} = {}) {
  const [resultado] = await pool.execute(
    `INSERT INTO chamados
       (cliente_id, responsavel_id, titulo, descricao, categoria, prioridade,
        status, created_at, updated_at, resolved_at, first_response_at, sla_started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cliente_id,
      responsavel_id,
      titulo,
      descricao,
      categoria,
      prioridade,
      status,
      created_at,
      created_at,
      resolved_at,
      first_response_at,
      sla_started_at,
    ],
  )

  return { id: resultado.insertId }
}

export function subirServidor(overrides = {}) {
  const app = criarApp({ variaveis: { ...process.env, ...overrides } })

  return new Promise((resolve, reject) => {
    const servidor = app.listen(0, '127.0.0.1', () => {
      const endereco = servidor.address()
      resolve({
        baseUrl: `http://127.0.0.1:${endereco.port}`,
        async fechar() {
          servidor.closeAllConnections?.()
          await new Promise((res) => servidor.close(res))
        },
      })
    })
    servidor.once('error', reject)
  })
}

export async function login(baseUrl, email, senha) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  const body = await response.json()

  return { status: response.status, body }
}

export function tokenValido(usuarioId, extras = {}) {
  return jwt.sign({ id: usuarioId, ...extras }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })
}

export { pool }
