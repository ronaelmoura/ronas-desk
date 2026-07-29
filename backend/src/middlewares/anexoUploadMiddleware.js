import multer from 'multer'

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: TAMANHO_MAXIMO_ANEXO,
  },
})

export default function anexoUploadMiddleware(request, response, next) {
  upload.single('arquivo')(request, response, (error) => {
    if (!error) return next()

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'O anexo deve ter no máximo 10 MB.'
          : 'Não foi possível processar o anexo enviado.'

      return response.status(400).json({ status: 'erro', message })
    }

    console.error('Erro ao receber anexo:', error)
    return response.status(500).json({
      status: 'erro',
      message: 'Não foi possível processar o anexo enviado.',
    })
  })
}
