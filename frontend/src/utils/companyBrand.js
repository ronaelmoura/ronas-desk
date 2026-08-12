export function usarLogoPadrao(event) {
  const imagem = event.currentTarget
  imagem.onerror = null
  imagem.src = '/brand-mark.svg'
}
