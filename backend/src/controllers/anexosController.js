import pool from '../database/db.js'
import anexoModel from '../models/anexoModel.js'
import chamadoModel from '../models/chamadoModel.js'
import anexoService, {
  CloudinaryNaoConfiguradoError,
  validarArquivo,
} from '../services/anexoService.js'
import historyService from '../services/historyService.js'

function validarId(id) {
  return Number.isInteger(id) && id > 0
}

function serializarAnexo(anexo) {
  return {
    id: anexo.id,
    chamado_id: anexo.chamado_id,
    nome_original: anexo.nome_original,
    mime_type: anexo.mime_type,
    tamanho_bytes: anexo.tamanho_bytes,
    created_at: anexo.created_at,
    usuario_id: anexo.usuario_id,
    usuario_nome: anexo.usuario_nome,
  }
}

function responderErroArmazenamento(error, response, operacao) {
  if (error instanceof CloudinaryNaoConfiguradoError) {
    return response.status(503).json({
      status: 'erro',
      message: error.message,
    })
  }

  console.error(`Erro no armazenamento ao ${operacao} anexo:`, error.message)
  return response.status(502).json({
    status: 'erro',
    message: 'O armazenamento de anexos está temporariamente indisponível.',
  })
}

async function listar(request, response) {
  const chamadoId = Number(request.params.id)

  if (!validarId(chamadoId)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  try {
    if (!(await chamadoModel.buscarPorId(chamadoId))) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    const anexos = await anexoModel.listarPorChamado(chamadoId)
    return response.status(200).json(anexos.map(serializarAnexo))
  } catch (error) {
    console.error('Erro ao listar anexos:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível carregar os anexos.',
    })
  }
}

async function criar(request, response) {
  const chamadoId = Number(request.params.id)

  if (!validarId(chamadoId)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  const erroArquivo = validarArquivo(request.file)
  if (erroArquivo) {
    return response.status(400).json({
      status: 'erro',
      message: erroArquivo,
    })
  }

  let conexao
  let arquivoEnviado
  let etapa = 'banco'

  try {
    if (!(await chamadoModel.buscarPorId(chamadoId))) {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    etapa = 'armazenamento'
    arquivoEnviado = await anexoService.enviar(request.file, chamadoId)
    etapa = 'banco'

    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    if (!(await chamadoModel.buscarPorIdParaAtualizacao(chamadoId, conexao))) {
      const error = new Error('Chamado removido durante o envio do anexo.')
      error.name = 'ChamadoRemovidoError'
      throw error
    }

    const anexo = await anexoModel.criar(
      {
        chamado_id: chamadoId,
        usuario_id: request.usuario.id,
        nome_original: request.file.originalname,
        mime_type: request.file.mimetype,
        tamanho_bytes: arquivoEnviado.tamanho_bytes || request.file.size,
        ...arquivoEnviado,
      },
      conexao,
    )

    await historyService.registrarAnexoAdicionado(
      chamadoId,
      anexo,
      request.usuario.id,
      conexao,
    )

    await conexao.commit()
    return response.status(201).json(serializarAnexo(anexo))
  } catch (error) {
    if (conexao) await conexao.rollback()

    if (arquivoEnviado) {
      try {
        await anexoService.remover(arquivoEnviado)
      } catch (cleanupError) {
        console.error(
          'Não foi possível compensar o envio do anexo:',
          cleanupError.message,
        )
      }
    }

    if (error.name === 'ChamadoRemovidoError') {
      return response.status(404).json({
        status: 'erro',
        message: 'Chamado não encontrado.',
      })
    }

    if (
      error instanceof CloudinaryNaoConfiguradoError ||
      etapa === 'armazenamento'
    ) {
      return responderErroArmazenamento(error, response, 'enviar')
    }

    console.error('Erro ao registrar anexo:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível registrar o anexo.',
    })
  } finally {
    conexao?.release()
  }
}

async function gerarDownload(request, response) {
  const chamadoId = Number(request.params.id)
  const anexoId = Number(request.params.anexoId)
  let etapa = 'banco'

  if (!validarId(chamadoId) || !validarId(anexoId)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  try {
    const anexo = await anexoModel.buscarPorId(chamadoId, anexoId)

    if (!anexo) {
      return response.status(404).json({
        status: 'erro',
        message: 'Anexo não encontrado.',
      })
    }

    etapa = 'armazenamento'
    const url = anexoService.gerarUrlTemporaria(anexo)

    return response.status(200).json({
      url,
      expires_in: 300,
    })
  } catch (error) {
    if (
      error instanceof CloudinaryNaoConfiguradoError ||
      etapa === 'armazenamento'
    ) {
      return responderErroArmazenamento(error, response, 'abrir')
    }

    console.error('Erro ao buscar anexo:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível abrir o anexo.',
    })
  }
}

async function excluir(request, response) {
  const chamadoId = Number(request.params.id)
  const anexoId = Number(request.params.anexoId)

  if (!validarId(chamadoId) || !validarId(anexoId)) {
    return response.status(400).json({
      status: 'erro',
      message: 'ID inválido.',
    })
  }

  let conexao
  let etapa = 'banco'

  try {
    const anexoExistente = await anexoModel.buscarPorId(chamadoId, anexoId)

    if (!anexoExistente) {
      return response.status(404).json({
        status: 'erro',
        message: 'Anexo não encontrado.',
      })
    }

    etapa = 'armazenamento'
    await anexoService.remover(anexoExistente)
    etapa = 'banco'

    conexao = await pool.getConnection()
    await conexao.beginTransaction()

    const anexo = await anexoModel.buscarPorIdParaAtualizacao(
      chamadoId,
      anexoId,
      conexao,
    )

    if (!anexo) {
      await conexao.rollback()
      return response.status(404).json({
        status: 'erro',
        message: 'Anexo não encontrado.',
      })
    }

    await anexoModel.excluir(chamadoId, anexoId, conexao)
    await historyService.registrarAnexoRemovido(
      chamadoId,
      anexo,
      request.usuario.id,
      conexao,
    )

    await conexao.commit()
    return response.status(200).json({
      status: 'sucesso',
      message: 'Anexo excluído com sucesso.',
    })
  } catch (error) {
    if (conexao) await conexao.rollback()

    if (
      error instanceof CloudinaryNaoConfiguradoError ||
      etapa === 'armazenamento'
    ) {
      return responderErroArmazenamento(error, response, 'excluir')
    }

    console.error('Erro ao excluir anexo:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível excluir o anexo.',
    })
  } finally {
    conexao?.release()
  }
}

export default {
  listar,
  criar,
  gerarDownload,
  excluir,
}
