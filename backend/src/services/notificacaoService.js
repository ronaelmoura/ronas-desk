import notificacaoModel from '../models/notificacaoModel.js'
import usuarioModel from '../models/usuarioModel.js'

function resumoChamado(chamado) {
  return `#${String(chamado.id).padStart(3, '0')} — ${chamado.titulo}`
}

export function criarNotificacaoService({
  notificacoes = notificacaoModel,
  usuarios = usuarioModel,
} = {}) {
  async function criarParaUsuarios(usuarioIds, dados, executor) {
    const destinos = [...new Set(usuarioIds)].filter(Boolean)

    for (const usuarioId of destinos) {
      await notificacoes.criar({ ...dados, usuario_id: usuarioId }, executor)
    }
  }

  async function notificarEquipe(dados, usuarioAutorId, executor) {
    const equipe = await usuarios.listarEquipeAtiva(executor)
    const destinos = equipe
      .map((usuario) => usuario.id)
      .filter((id) => id !== usuarioAutorId)

    return criarParaUsuarios(destinos, dados, executor)
  }

  async function notificarCliente(clienteId, dados, executor) {
    const cliente = await usuarios.buscarPorClienteId(clienteId, executor)
    if (!cliente?.ativo || cliente.is_demo) return

    return criarParaUsuarios([cliente.id], dados, executor)
  }

  async function novoChamado(chamado, usuarioAutorId, executor) {
    return notificarEquipe(
      {
        chamado_id: chamado.id,
        tipo: 'NOVO_CHAMADO',
        titulo: 'Novo chamado recebido',
        mensagem: resumoChamado(chamado),
      },
      usuarioAutorId,
      executor,
    )
  }

  async function atualizacaoChamado(anterior, atual, usuarioAutorId, executor) {
    if (
      atual.responsavel_id &&
      atual.responsavel_id !== anterior.responsavel_id &&
      atual.responsavel_id !== usuarioAutorId
    ) {
      await criarParaUsuarios(
        [atual.responsavel_id],
        {
          chamado_id: atual.id,
          tipo: 'CHAMADO_ATRIBUIDO',
          titulo: 'Chamado atribuído a você',
          mensagem: resumoChamado(atual),
        },
        executor,
      )
    }

    const foiEncerrado = ['Resolvido', 'Fechado'].includes(atual.status)
    const estavaEncerrado = ['Resolvido', 'Fechado'].includes(anterior.status)

    if (foiEncerrado && !estavaEncerrado) {
      await notificarCliente(
        atual.cliente_id,
        {
          chamado_id: atual.id,
          tipo: 'AVALIACAO_DISPONIVEL',
          titulo: 'Avalie seu atendimento',
          mensagem: `Conte como foi sua experiência em ${resumoChamado(atual)}.`,
        },
        executor,
      )
    }
  }

  async function comentarioDoCliente(chamado, usuarioAutorId, executor) {
    const dados = {
      chamado_id: chamado.id,
      tipo: 'RESPOSTA_CLIENTE',
      titulo: 'Nova mensagem do cliente',
      mensagem: resumoChamado(chamado),
    }

    if (chamado.responsavel_id && chamado.responsavel_id !== usuarioAutorId) {
      return criarParaUsuarios([chamado.responsavel_id], dados, executor)
    }

    return notificarEquipe(dados, usuarioAutorId, executor)
  }

  async function comentarioDaEquipe(chamado, executor) {
    return notificarCliente(
      chamado.cliente_id,
      {
        chamado_id: chamado.id,
        tipo: 'RESPOSTA_EQUIPE',
        titulo: 'Nova atualização no chamado',
        mensagem: resumoChamado(chamado),
      },
      executor,
    )
  }

  return {
    novoChamado,
    atualizacaoChamado,
    comentarioDoCliente,
    comentarioDaEquipe,
  }
}

export default criarNotificacaoService()
