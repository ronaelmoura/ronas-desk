import chamadoModel from '../models/chamadoModel.js'
import historyService from './historyService.js'
import resolucaoChamadoService from './resolucaoChamadoService.js'

const STATUS_ENCERRADOS = new Set(['Resolvido', 'Fechado'])

export function criarReaberturaChamadoService({
  chamados = chamadoModel,
  historico = historyService,
  resolucao = resolucaoChamadoService,
} = {}) {
  async function aoReceberRespostaCliente(
    chamado,
    usuarioId,
    executor,
    agora = new Date(),
  ) {
    if (!STATUS_ENCERRADOS.has(chamado.status)) return chamado

    const chamadoReaberto = await chamados.atualizar(
      chamado.id,
      {
        ...chamado,
        status: 'Em Atendimento',
        resolved_at: resolucao.determinarResolvedAt(
          chamado.status,
          'Em Atendimento',
          chamado.resolved_at,
          agora,
        ),
        sla_started_at: resolucao.determinarSlaStartedAt(
          chamado.status,
          'Em Atendimento',
          chamado.sla_started_at,
          agora,
        ),
      },
      executor,
    )

    await historico.registrarAtualizacao(
      chamado,
      chamadoReaberto,
      usuarioId,
      executor,
    )

    return chamadoReaberto
  }

  return { aoReceberRespostaCliente }
}

export default criarReaberturaChamadoService()
