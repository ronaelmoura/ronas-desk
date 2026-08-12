export const ATENDENTES_DEMO = [
  { nome: 'Ana Lima', email: 'ana.lima@empresa-exemplo.com' },
  { nome: 'Bruno Costa', email: 'bruno.costa@empresa-exemplo.com' },
  { nome: 'Carla Mendes', email: 'carla.mendes@empresa-exemplo.com' },
  { nome: 'Diego Alves', email: 'diego.alves@empresa-exemplo.com' },
]

export const CLIENTES_DEMO = [
  [
    'Mariana Souza',
    'mariana.souza@alphalog.example',
    '(21) 99910-1201',
    'Alpha Logística',
  ],
  [
    'Carlos Ribeiro',
    'carlos.ribeiro@novacont.example',
    '(11) 99820-2302',
    'NovaCont',
  ],
  [
    'Fernanda Rocha',
    'fernanda.rocha@clinicaviva.example',
    '(31) 99730-3403',
    'Clínica Viva',
  ],
  [
    'Lucas Martins',
    'lucas.martins@horizonte.example',
    '(41) 99640-4504',
    'Horizonte Engenharia',
  ],
  [
    'Patrícia Gomes',
    'patricia.gomes@mercadobom.example',
    '(51) 99550-5605',
    'Mercado Bom',
  ],
  [
    'Rafael Nunes',
    'rafael.nunes@colegiofuturo.example',
    '(71) 99460-6706',
    'Colégio Futuro',
  ],
]

export const CHAMADOS_DEMO = [
  [
    'ERP indisponível no setor financeiro',
    'O sistema apresenta erro ao iniciar em três computadores.',
    'Software',
    'Crítica',
    'Em Atendimento',
    0,
    0,
    1,
  ],
  [
    'Notebook não conecta ao Wi-Fi',
    'O equipamento deixou de localizar a rede corporativa.',
    'Rede',
    'Alta',
    'Aguardando Cliente',
    1,
    1,
    3,
  ],
  [
    'Solicitação de acesso ao sistema fiscal',
    'Liberar perfil de consulta para a nova colaboradora.',
    'Acesso',
    'Média',
    'Novo',
    1,
    2,
    0,
  ],
  [
    'Impressora imprime páginas em branco',
    'A impressora do atendimento está sem qualidade de impressão.',
    'Impressora',
    'Média',
    'Resolvido',
    2,
    2,
    6,
  ],
  [
    'Caixa de e-mail atingiu o limite',
    'Não é possível receber novas mensagens na conta comercial.',
    'E-mail',
    'Alta',
    'Fechado',
    2,
    3,
    12,
  ],
  [
    'Monitor apresenta tela piscando',
    'A imagem oscila após alguns minutos de uso.',
    'Hardware',
    'Baixa',
    'Cancelado',
    3,
    0,
    18,
  ],
  [
    'VPN desconecta durante reuniões',
    'A conexão remota cai várias vezes ao longo do dia.',
    'Rede',
    'Alta',
    'Em Atendimento',
    3,
    1,
    2,
  ],
  [
    'Atualização do navegador corporativo',
    'Atualizar o navegador das máquinas da recepção.',
    'Software',
    'Baixa',
    'Resolvido',
    4,
    2,
    9,
  ],
  [
    'Teclado com teclas sem resposta',
    'As teclas Enter e espaço pararam de funcionar.',
    'Hardware',
    'Média',
    'Novo',
    4,
    3,
    1,
  ],
  [
    'Cadastro bloqueado após tentativas',
    'O usuário não consegue acessar o portal interno.',
    'Acesso',
    'Alta',
    'Aguardando Cliente',
    5,
    0,
    4,
  ],
  [
    'Configurar assinatura de e-mail',
    'Padronizar a assinatura do novo coordenador.',
    'E-mail',
    'Baixa',
    'Fechado',
    5,
    1,
    20,
  ],
  [
    'Lentidão ao abrir arquivos compartilhados',
    'Arquivos da rede demoram mais de dois minutos para abrir.',
    'Rede',
    'Crítica',
    'Resolvido',
    0,
    2,
    5,
  ],
  [
    'Instalação do leitor de PDF',
    'Instalar aplicativo homologado no computador administrativo.',
    'Software',
    'Média',
    'Fechado',
    0,
    3,
    25,
  ],
  [
    'Scanner não reconhecido pelo computador',
    'O scanner USB não aparece entre os dispositivos.',
    'Hardware',
    'Alta',
    'Em Atendimento',
    1,
    0,
    7,
  ],
  [
    'Criar acesso para professor substituto',
    'Acesso temporário necessário para o portal acadêmico.',
    'Acesso',
    'Média',
    'Resolvido',
    5,
    1,
    14,
  ],
]

function dataAnterior(data, dias, minutos = 0) {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() - dias)
  resultado.setHours(9, minutos, 0, 0)
  return resultado
}

async function buscarId(executor, tabela, coluna, valor) {
  const [rows] = await executor.execute(
    `SELECT id FROM ${tabela} WHERE ${coluna} = ? LIMIT 1`,
    [valor],
  )
  return rows[0]?.id || null
}

async function criarAtendentes(executor, senhaHash) {
  const ids = []
  for (const atendente of ATENDENTES_DEMO) {
    let id = await buscarId(executor, 'usuarios', 'email', atendente.email)
    if (!id) {
      const [resultado] = await executor.execute(
        `INSERT INTO usuarios (nome, email, senha_hash, cargo, ativo, is_demo)
         VALUES (?, ?, ?, 'Atendente', 1, 0)`,
        [atendente.nome, atendente.email, senhaHash],
      )
      id = resultado.insertId
    }
    ids.push(id)
  }
  return ids
}

async function criarClientes(executor) {
  const ids = []
  for (const [nome, email, telefone, empresa] of CLIENTES_DEMO) {
    let id = await buscarId(executor, 'clientes', 'email', email)
    if (!id) {
      const [resultado] = await executor.execute(
        `INSERT INTO clientes (nome, email, telefone, empresa, ativo)
         VALUES (?, ?, ?, ?, 1)`,
        [nome, email, telefone, empresa],
      )
      id = resultado.insertId
    }
    ids.push(id)
  }
  return ids
}

async function buscarChamado(executor, clienteId, titulo) {
  const [rows] = await executor.execute(
    'SELECT id FROM chamados WHERE cliente_id = ? AND titulo = ? LIMIT 1',
    [clienteId, titulo],
  )
  return rows[0]?.id || null
}

async function registrarSeAusente(
  executor,
  consulta,
  parametros,
  insercao,
  valores,
) {
  const [rows] = await executor.execute(consulta, parametros)
  if (!rows[0]) await executor.execute(insercao, valores)
}

export async function popularDadosDemonstracao({
  executor,
  senhaHash,
  agora = new Date(),
}) {
  if (!executor || !senhaHash)
    throw new Error('Executor e hash de senha são obrigatórios.')

  const atendentes = await criarAtendentes(executor, senhaHash)
  const clientes = await criarClientes(executor)

  for (const item of CHAMADOS_DEMO) {
    const [
      titulo,
      descricao,
      categoria,
      prioridade,
      status,
      cliente,
      responsavel,
      dias,
    ] = item
    const clienteId = clientes[cliente]
    const responsavelId = atendentes[responsavel]
    const criadoEm = dataAnterior(agora, dias)
    const primeiraResposta =
      status === 'Novo' ? null : dataAnterior(agora, dias, 45)
    const encerrado = ['Resolvido', 'Fechado'].includes(status)
      ? new Date(criadoEm.getTime() + 26 * 60 * 60000)
      : null

    let chamadoId = await buscarChamado(executor, clienteId, titulo)
    if (!chamadoId) {
      const [resultado] = await executor.execute(
        `INSERT INTO chamados
         (cliente_id, responsavel_id, titulo, descricao, categoria, prioridade,
          status, created_at, updated_at, resolved_at, first_response_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clienteId,
          responsavelId,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
          criadoEm,
          encerrado || primeiraResposta || criadoEm,
          encerrado,
          primeiraResposta,
        ],
      )
      chamadoId = resultado.insertId
    }

    await registrarSeAusente(
      executor,
      'SELECT id FROM ticket_history WHERE ticket_id = ? AND event_type = ? AND description = ? LIMIT 1',
      [chamadoId, 'CHAMADO_CRIADO', 'Chamado criado para demonstração.'],
      `INSERT INTO ticket_history
       (ticket_id, user_id, event_type, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      [
        chamadoId,
        responsavelId,
        'CHAMADO_CRIADO',
        'Chamado criado para demonstração.',
        criadoEm,
      ],
    )

    if (primeiraResposta) {
      const resposta =
        'Recebemos a solicitação e iniciamos a análise com a equipe responsável.'
      await registrarSeAusente(
        executor,
        'SELECT id FROM comentarios WHERE chamado_id = ? AND conteudo = ? AND tipo = ? LIMIT 1',
        [chamadoId, resposta, 'PUBLICO'],
        `INSERT INTO comentarios
         (chamado_id, usuario_id, conteudo, tipo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          chamadoId,
          responsavelId,
          resposta,
          'PUBLICO',
          primeiraResposta,
          primeiraResposta,
        ],
      )
      const nota = `Diagnóstico interno registrado para o chamado: ${titulo}.`
      const notaEm = new Date(primeiraResposta.getTime() + 20 * 60000)
      await registrarSeAusente(
        executor,
        'SELECT id FROM comentarios WHERE chamado_id = ? AND conteudo = ? AND tipo = ? LIMIT 1',
        [chamadoId, nota, 'INTERNO'],
        `INSERT INTO comentarios
         (chamado_id, usuario_id, conteudo, tipo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chamadoId, responsavelId, nota, 'INTERNO', notaEm, notaEm],
      )
    }

    if (encerrado) {
      const descricaoStatus = `Chamado marcado como ${status}.`
      await registrarSeAusente(
        executor,
        'SELECT id FROM ticket_history WHERE ticket_id = ? AND event_type = ? AND description = ? LIMIT 1',
        [chamadoId, 'STATUS_ALTERADO', descricaoStatus],
        `INSERT INTO ticket_history
         (ticket_id, user_id, event_type, description, created_at) VALUES (?, ?, ?, ?, ?)`,
        [
          chamadoId,
          responsavelId,
          'STATUS_ALTERADO',
          descricaoStatus,
          encerrado,
        ],
      )
    }
  }

  return {
    atendentes: ATENDENTES_DEMO.length,
    clientes: CLIENTES_DEMO.length,
    chamados: CHAMADOS_DEMO.length,
  }
}
