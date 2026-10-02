export function usarLogoPadrao(event) {
  const imagem = event.currentTarget
  // React delega onError; zerar a propriedade DOM não remove esse listener.
  if (imagem.getAttribute('src') !== '/brand-mark.svg') {
    imagem.src = '/brand-mark.svg'
  }
}
