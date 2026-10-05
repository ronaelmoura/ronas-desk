import { criarDadosDemo } from '../services/demoDataService.js'
import {
  normalizarPaginacao,
  criarRespostaPaginada,
} from '../services/paginacaoService.js'
import relatorioService from '../services/relatorioService.js'
import slaService from '../services/slaService.js'

function paginar(dados, query) {
  const paginacao = normalizarPaginacao(query)
  paginacao.pagina = Math.min(
    paginacao.pagina,
    Math.max(1, Math.ceil(dados.length / paginacao.limite)),
  )
  const inicio = (paginacao.pagina - 1) * paginacao.limite
  return criarRespostaPaginada(
    dados.slice(inicio, inicio + paginacao.limite),
    dados.length,
    paginacao,
  )
}

function filtrar(dados, query, periodo) {
  const filtros = relatorioService.normalizarFiltros(query)
  const busca = String(query.busca || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
  return dados.filter(
    (item) =>
      Object.entries(filtros).every(
        ([campo, valor]) => !valor || item[campo] === valor,
      ) &&
      (!busca ||
        [
          item.titulo,
          item.descricao,
          item.cliente_nome,
          item.nome,
          item.email,
          item.empresa,
        ].some((valor) => valor?.toLocaleLowerCase('pt-BR').includes(busca))) &&
      (!periodo ||
        (item.created_at.slice(0, 10) >= periodo.data_inicio &&
          item.created_at.slice(0, 10) <= periodo.data_fim)),
  )
}

export function responderDemo(request, response) {
  try {
    const { clientes, usuarios, chamados } = criarDadosDemo()
    const query = request.query
    const caminho = request.path.replace(/\/$/, '')
    const naoEncontrado = () =>
      response.status(404).json({
        status: 'erro',
        message: 'Registro ou rota não encontrado na demonstração.',
      })
    if (caminho === '/notificacoes')
      return response.json({ notificacoes: [], naoLidas: 0 })
    if (caminho === '/dashboard') {
      const periodo =
        query.data_inicio || query.data_fim
          ? relatorioService.normalizarPeriodo(query)
          : null
      const lista = filtrar(chamados, {}, periodo)
      const resumo = {
        total_clientes: clientes.length,
        total_usuarios: usuarios.length,
        total_chamados: lista.length,
        periodo,
        chamados_recentes: lista.slice(0, 5),
        chamados_criticos: lista.filter((item) => item.prioridade === 'Crítica')
          .length,
      }
      for (const [campo, status] of Object.entries({
        chamados_novos: 'Novo',
        chamados_em_atendimento: 'Em Atendimento',
        chamados_aguardando_cliente: 'Aguardando Cliente',
        chamados_resolvidos: 'Resolvido',
        chamados_fechados: 'Fechado',
        chamados_cancelados: 'Cancelado',
      })) {
        resumo[campo] = lista.filter((item) => item.status === status).length
      }
      return response.json({
        ...resumo,
        ...slaService.calcularIndicadoresDashboard(
          lista.filter((item) => item.status !== 'Cancelado'),
        ),
      })
    }
    if (caminho === '/relatorios/chamados') {
      const periodo = relatorioService.normalizarPeriodo(query)
      const filtros = relatorioService.normalizarFiltros(query)
      const relatorio = relatorioService.gerarRelatorio(
        filtrar(chamados, query, periodo),
        periodo,
      )
      const { chamados: linhas, ...resumo } = relatorio
      return response.json({ ...resumo, filtros, ...paginar(linhas, query) })
    }
    const rota =
      /^\/(chamados|clientes|usuarios)(?:\/(\d+)(?:\/(chamados|comentarios|anexos|timeline|history|auditoria))?)?$/.exec(
        caminho,
      )
    if (!rota) return naoEncontrado()
    const [, recurso, id, subrecurso] = rota
    const colecao = { chamados, clientes, usuarios }[recurso]
    if (!id) {
      const periodo =
        query.data_inicio || query.data_fim
          ? relatorioService.normalizarPeriodo(query)
          : null
      let lista = filtrar(colecao, query, periodo)
      if (recurso === 'chamados') {
        lista = slaService.filtrarPorStatus(lista, query.sla_status)
        if (query.ordenacao === 'sla')
          lista.sort((a, b) => b.sla.percentage - a.sla.percentage)
        if (query.ordenacao === 'antigos') lista.reverse()
        if (query.ordenacao === 'prioridade') {
          const prioridades = ['Crítica', 'Alta', 'Média', 'Baixa']
          lista.sort(
            (a, b) =>
              prioridades.indexOf(a.prioridade) -
              prioridades.indexOf(b.prioridade),
          )
        }
      }
      return response.json(paginar(lista, query))
    }
    const registro = colecao.find((item) => item.id === Number(id))
    if (!registro) return naoEncontrado()
    if (!subrecurso) return response.json(registro)
    if (recurso === 'clientes' && subrecurso === 'chamados')
      return response.json(
        chamados.filter((item) => item.cliente_id === registro.id),
      )
    if (recurso !== 'chamados') return naoEncontrado()
    if (['anexos', 'comentarios'].includes(subrecurso)) return response.json([])
    if (['timeline', 'history', 'auditoria'].includes(subrecurso))
      return response.json([
        {
          id: registro.id,
          ticket_id: registro.id,
          user_id: registro.responsavel_id,
          user_name: registro.responsavel_nome,
          event_type: 'CHAMADO_CRIADO',
          description: 'Chamado fictício criado para demonstração.',
          old_values: null,
          new_values: null,
          created_at: registro.created_at,
        },
      ])
    return naoEncontrado()
  } catch (error) {
    if (
      [
        'PaginacaoInvalidaError',
        'PeriodoRelatorioInvalidoError',
        'FiltroRelatorioInvalidoError',
        'StatusSlaInvalidoError',
      ].includes(error.name)
    ) {
      return response
        .status(400)
        .json({ status: 'erro', message: error.message })
    }
    throw error
  }
}
