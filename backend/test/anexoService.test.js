import assert from 'node:assert/strict'
import test from 'node:test'
import { validarArquivo } from '../src/services/anexoService.js'

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
