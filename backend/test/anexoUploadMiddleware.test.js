import assert from 'node:assert/strict'
import express from 'express'
import test from 'node:test'

import anexoUploadMiddleware, {
  TAMANHO_MAXIMO_ANEXO,
} from '../src/middlewares/anexoUploadMiddleware.js'

async function iniciarServidorDeTeste() {
  const app = express()
  app.post('/upload', anexoUploadMiddleware, (request, response) => {
    response.status(200).json({ tamanho: request.file.size })
  })

  return new Promise((resolve) => {
    const servidor = app.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address()
      resolve({ servidor, baseUrl: `http://127.0.0.1:${port}` })
    })
  })
}

function criarFormularioComArquivo(tamanhoBytes) {
  const formulario = new FormData()
  const arquivo = new Blob([new Uint8Array(tamanhoBytes)], {
    type: 'application/octet-stream',
  })
  formulario.append('arquivo', arquivo, 'anexo.bin')
  return formulario
}

test('anexoUploadMiddleware aceita anexo com exatamente o tamanho máximo permitido', async () => {
  const { servidor, baseUrl } = await iniciarServidorDeTeste()

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: criarFormularioComArquivo(TAMANHO_MAXIMO_ANEXO),
    })
    const corpo = await response.json()

    assert.equal(response.status, 200)
    assert.equal(corpo.tamanho, TAMANHO_MAXIMO_ANEXO)
  } finally {
    servidor.close()
  }
})

test('anexoUploadMiddleware rejeita anexo maior que o tamanho máximo permitido', async () => {
  const { servidor, baseUrl } = await iniciarServidorDeTeste()

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: criarFormularioComArquivo(TAMANHO_MAXIMO_ANEXO + 1),
    })
    const corpo = await response.json()

    assert.equal(response.status, 400)
    assert.equal(corpo.message, 'O anexo deve ter no máximo 10 MB.')
  } finally {
    servidor.close()
  }
})
