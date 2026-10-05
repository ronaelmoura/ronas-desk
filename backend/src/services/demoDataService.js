import {
  ATENDENTES_DEMO,
  CLIENTES_DEMO,
  CHAMADOS_DEMO,
} from './demoSeedService.js'
import slaService from './slaService.js'

// Apenas dados fictícios em memória. Não importar models nem conexões aqui.
export function criarDadosDemo(agora = new Date()) {
  const data = (minutos) =>
    new Date(agora.getTime() - minutos * 60000).toISOString()
  const usuarios = ATENDENTES_DEMO.map((usuario, index) => ({
    ...usuario,
    email: `atendente${index + 1}@ronas.example`,
    id: index + 1,
    cargo: 'Técnico',
    ativo: true,
    is_demo: false,
    cliente_id: null,
    created_at: data(43200),
    updated_at: data(43200),
  }))
  const clientes = CLIENTES_DEMO.map(
    ([nome, email, telefone, empresa], index) => ({
      id: index + 1,
      nome,
      email,
      telefone,
      empresa,
      ativo: true,
      created_at: data(43200),
      updated_at: data(43200),
    }),
  )
  const chamados = CHAMADOS_DEMO.map(
    (
      [
        titulo,
        descricao,
        categoria,
        prioridade,
        status,
        cliente,
        responsavel,
        dias,
      ],
      index,
    ) => {
      const encerrado = ['Resolvido', 'Fechado', 'Cancelado'].includes(status)
      const idade = encerrado ? Math.max(1, dias) * 1440 : 30 + index * 20
      return {
        id: index + 1,
        titulo,
        descricao,
        categoria:
          categoria === 'Impressora'
            ? 'Hardware'
            : categoria === 'E-mail'
              ? 'Software'
              : categoria,
        prioridade,
        status,
        cliente_id: cliente + 1,
        responsavel_id: responsavel + 1,
        cliente_nome: clientes[cliente].nome,
        cliente_email: clientes[cliente].email,
        responsavel_nome: usuarios[responsavel].nome,
        created_at: data(idade),
        updated_at: data(idade - 15),
        sla_started_at: data(idade),
        first_response_at: status === 'Novo' ? null : data(idade - 10),
        resolved_at: encerrado ? data(idade - 45) : null,
      }
    },
  ).sort((a, b) => b.created_at.localeCompare(a.created_at))
  return {
    usuarios,
    clientes,
    chamados: slaService.enriquecerChamados(chamados, agora),
  }
}
