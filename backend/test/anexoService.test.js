import assert from 'node:assert/strict'
import test from 'node:test'
import { v2 as cloudinary } from 'cloudinary'
import anexoService, {
  validarArquivo,
  CloudinaryNaoConfiguradoError,
} from '../src/services/anexoService.js'

async function comCredenciaisCloudinary(fn) {
  const originais = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  }

  process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud'
  process.env.CLOUDINARY_API_KEY = 'demo-key'
  process.env.CLOUDINARY_API_SECRET = 'demo-secret'

  try {
    return await fn()
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originais.cloud
    process.env.CLOUDINARY_API_KEY = originais.key
    process.env.CLOUDINARY_API_SECRET = originais.secret
  }
}

function arquivo(overrides = {}) {
  return {
    originalname: 'evidencia.png',
    mimetype: 'image/png',
    size: 12,
    buffer: Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03, 0x04,
    ]),
    ...overrides,
  }
}

test('aceita arquivo quando extensão, MIME e assinatura são válidos', () => {
  assert.equal(validarArquivo(arquivo()), null)
})

test('rejeita arquivo ausente', () => {
  assert.equal(validarArquivo(undefined), 'Selecione um arquivo para anexar.')
})

test('rejeita conteúdo disfarçado com extensão permitida', () => {
  assert.match(
    validarArquivo(arquivo({ buffer: Buffer.from('conteudo falso') })),
    /arquivo PDF válido/,
  )
})

test('rejeita extensão incompatível com o MIME informado', () => {
  assert.match(
    validarArquivo(arquivo({ originalname: 'evidencia.pdf' })),
    /imagem JPG/,
  )
})

test('rejeita arquivo acima do limite de 10 MB', () => {
  assert.equal(
    validarArquivo(arquivo({ size: 10 * 1024 * 1024 + 1 })),
    'O anexo deve ter no máximo 10 MB.',
  )
})

test('aceita PDF com assinatura válida', () => {
  const pdf = arquivo({
    originalname: 'relatorio.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7 dados'),
  })

  assert.equal(validarArquivo(pdf), null)
})

test('enviar lança CloudinaryNaoConfiguradoError quando faltam credenciais', async () => {
  const originais = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  }
  delete process.env.CLOUDINARY_CLOUD_NAME
  delete process.env.CLOUDINARY_API_KEY
  delete process.env.CLOUDINARY_API_SECRET

  try {
    await assert.rejects(
      () => anexoService.enviar(arquivo(), 1),
      CloudinaryNaoConfiguradoError,
    )
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = originais.cloud
    process.env.CLOUDINARY_API_KEY = originais.key
    process.env.CLOUDINARY_API_SECRET = originais.secret
  }
})

test('enviar envia o buffer para o Cloudinary e retorna os metadados do anexo', async () => {
  const originalUploadStream = cloudinary.uploader.upload_stream
  cloudinary.uploader.upload_stream = (opcoes, callback) => {
    assert.equal(opcoes.resource_type, 'raw')
    assert.equal(opcoes.type, 'authenticated')
    return {
      end() {
        callback(null, {
          public_id: opcoes.public_id,
          asset_id: 'asset-123',
          format: 'png',
          bytes: 12,
        })
      },
    }
  }

  try {
    const resultado = await comCredenciaisCloudinary(() =>
      anexoService.enviar(arquivo(), 42),
    )

    assert.match(resultado.cloudinary_public_id, /^ronas-desk\/chamados\/42\//)
    assert.equal(resultado.cloudinary_asset_id, 'asset-123')
    assert.equal(resultado.formato, 'png')
    assert.equal(resultado.tamanho_bytes, 12)
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream
  }
})

test('enviar propaga erro quando o upload para o Cloudinary falha', async () => {
  const originalUploadStream = cloudinary.uploader.upload_stream
  cloudinary.uploader.upload_stream = (_opcoes, callback) => ({
    end() {
      callback(new Error('falha de rede'))
    },
  })

  try {
    await assert.rejects(
      () => comCredenciaisCloudinary(() => anexoService.enviar(arquivo(), 42)),
      /falha de rede/,
    )
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream
  }
})

test('remover exclui o arquivo confirmado pelo Cloudinary', async () => {
  const originalDestroy = cloudinary.uploader.destroy
  const chamadas = []
  cloudinary.uploader.destroy = async (publicId, opcoes) => {
    chamadas.push({ publicId, opcoes })
    return { result: 'ok' }
  }

  try {
    await comCredenciaisCloudinary(() =>
      anexoService.remover({
        cloudinary_public_id: 'ronas-desk/chamados/1/x.png',
      }),
    )

    assert.equal(chamadas[0].publicId, 'ronas-desk/chamados/1/x.png')
    assert.equal(chamadas[0].opcoes.resource_type, 'raw')
  } finally {
    cloudinary.uploader.destroy = originalDestroy
  }
})

test('remover trata "not found" como exclusão bem-sucedida', async () => {
  const originalDestroy = cloudinary.uploader.destroy
  cloudinary.uploader.destroy = async () => ({ result: 'not found' })

  try {
    await comCredenciaisCloudinary(() =>
      anexoService.remover({
        cloudinary_public_id: 'ronas-desk/chamados/1/x.png',
      }),
    )
  } finally {
    cloudinary.uploader.destroy = originalDestroy
  }
})

test('remover lança erro quando o Cloudinary não confirma a exclusão', async () => {
  const originalDestroy = cloudinary.uploader.destroy
  cloudinary.uploader.destroy = async () => ({ result: 'error' })

  try {
    await assert.rejects(
      () =>
        comCredenciaisCloudinary(() =>
          anexoService.remover({ cloudinary_public_id: 'x' }),
        ),
      /não confirmou a exclusão/,
    )
  } finally {
    cloudinary.uploader.destroy = originalDestroy
  }
})

test('gerarUrlTemporaria monta a URL autenticada com expiração futura', async () => {
  const originalUrl = cloudinary.utils.private_download_url
  const chamadas = []
  cloudinary.utils.private_download_url = (publicId, formato, opcoes) => {
    chamadas.push({ publicId, formato, opcoes })
    return 'https://res.cloudinary.com/demo/assinada'
  }

  try {
    const url = await comCredenciaisCloudinary(async () =>
      anexoService.gerarUrlTemporaria({
        cloudinary_public_id: 'ronas-desk/chamados/1/x.pdf',
        formato: 'pdf',
      }),
    )

    assert.equal(url, 'https://res.cloudinary.com/demo/assinada')
    assert.equal(chamadas[0].publicId, 'ronas-desk/chamados/1/x.pdf')
    assert.equal(chamadas[0].formato, 'pdf')
    assert.equal(chamadas[0].opcoes.type, 'authenticated')
    assert.ok(chamadas[0].opcoes.expires_at > Math.floor(Date.now() / 1000))
  } finally {
    cloudinary.utils.private_download_url = originalUrl
  }
})
