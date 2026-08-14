import chamadoModel from '../models/chamadoModel.js'
import comentarioModel from '../models/comentarioModel.js'
import historyService from '../services/historyService.js'
import assistenteIaService, {
  AssistenteIaErroError,
  AssistenteIaIndisponivelError,
} from '../services/assistenteIaService.js'

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

async function gerarResumo(request, response) {
  const id = Number(request.params.id)

  if (!validarId(id)) {
    return response
      .status(400)
      .json({ status: 'erro', message: 'ID inválido.' })
  }

  try {
    const chamado = await chamadoModel.buscarPorId(id)

    if (!chamado) {
      return response
        .status(404)
        .json({ status: 'erro', message: 'Chamado não encontrado.' })
    }

    const [comentarios, historico] = await Promise.all([
      comentarioModel.listarPorChamado(id),
      historyService.listarPorChamado(id),
    ])
    const resumo = await assistenteIaService.gerarResumoChamado({
      chamado,
      comentarios,
      historico,
    })

    return response.status(200).json(resumo)
  } catch (error) {
    if (error instanceof AssistenteIaIndisponivelError) {
      return response.status(503).json({
        status: 'erro',
        message: 'O assistente de IA ainda não está configurado.',
      })
    }

    if (error instanceof AssistenteIaErroError) {
      const diagnostico = error.codigoHttp
        ? `HTTP ${error.codigoHttp}`
        : error.tipo

      console.error(`Falha segura do assistente de IA: ${diagnostico}`)

      return response.status(502).json({
        status: 'erro',
        message: 'Não foi possível gerar o resumo com IA. Tente novamente.',
      })
    }

    console.error('Erro ao gerar resumo com IA:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível gerar o resumo com IA.',
    })
  }
}

export default { gerarResumo }
