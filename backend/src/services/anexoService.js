import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { TAMANHO_MAXIMO_ANEXO } from '../middlewares/anexoUploadMiddleware.js'

const TIPOS_PERMITIDOS = Object.freeze({
  'image/jpeg': {
    extensoes: ['.jpg', '.jpeg'],
    assinatura: (buffer) =>
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  'image/png': {
    extensoes: ['.png'],
    assinatura: (buffer) =>
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extensoes: ['.webp'],
    assinatura: (buffer) =>
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  'image/gif': {
    extensoes: ['.gif'],
    assinatura: (buffer) =>
      ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
  },
  'application/pdf': {
    extensoes: ['.pdf'],
    assinatura: (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  },
})

export class CloudinaryNaoConfiguradoError extends Error {
  constructor() {
    super('O armazenamento de anexos não está configurado.')
    this.name = 'CloudinaryNaoConfiguradoError'
  }
}

function configurarCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryNaoConfiguradoError()
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function validarArquivo(arquivo) {
  if (!arquivo?.buffer?.length) {
    return 'Selecione um arquivo para anexar.'
  }

  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    return 'O anexo deve ter no máximo 10 MB.'
  }

  const configuracao = TIPOS_PERMITIDOS[arquivo.mimetype]
  const extensao = path.extname(arquivo.originalname).toLowerCase()

  if (
    !configuracao ||
    !configuracao.extensoes.includes(extensao) ||
    !configuracao.assinatura(arquivo.buffer)
  ) {
    return 'Envie uma imagem JPG, PNG, WEBP ou GIF, ou um arquivo PDF válido.'
  }

  if (arquivo.originalname.length > 255) {
    return 'O nome do arquivo deve ter no máximo 255 caracteres.'
  }

  return null
}

function enviarStream(buffer, opcoes) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      opcoes,
      (error, resultado) => {
        if (error) reject(error)
        else resolve(resultado)
      },
    )

    stream.end(buffer)
  })
}

async function enviar(arquivo, chamadoId) {
  configurarCloudinary()

  const extensao = path.extname(arquivo.originalname).toLowerCase()
  const publicId = `ronas-desk/chamados/${chamadoId}/${randomUUID()}${extensao}`
  const resultado = await enviarStream(arquivo.buffer, {
    public_id: publicId,
    resource_type: 'raw',
    type: 'authenticated',
    overwrite: false,
  })

  return {
    cloudinary_public_id: resultado.public_id,
    cloudinary_asset_id: resultado.asset_id,
    formato: (resultado.format || extensao.slice(1)).toLowerCase(),
    tamanho_bytes: resultado.bytes,
  }
}

async function remover(anexo) {
  configurarCloudinary()

  const resultado = await cloudinary.uploader.destroy(
    anexo.cloudinary_public_id,
    {
      resource_type: 'raw',
      type: 'authenticated',
      invalidate: true,
    },
  )

  if (!['ok', 'not found'].includes(resultado.result)) {
    throw new Error('O Cloudinary não confirmou a exclusão do arquivo.')
  }
}

function gerarUrlTemporaria(anexo) {
  configurarCloudinary()

  return cloudinary.utils.private_download_url(
    anexo.cloudinary_public_id,
    anexo.formato,
    {
      resource_type: 'raw',
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    },
  )
}

export default {
  enviar,
  remover,
  gerarUrlTemporaria,
}
