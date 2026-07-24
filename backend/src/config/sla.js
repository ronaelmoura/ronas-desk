export const SLA_PADRAO_MINUTOS = Object.freeze({
  Crítica: 2 * 60,
  Alta: 8 * 60,
  Média: 24 * 60,
  Baixa: 72 * 60,
})

export const PERCENTUAL_PROXIMO_VENCIMENTO = 80

export const STATUS_SLA = Object.freeze({
  DENTRO_DO_PRAZO: 'Dentro do prazo',
  PROXIMO_DO_VENCIMENTO: 'Próximo do vencimento',
  VENCIDO: 'Vencido',
})

export const STATUS_FINALIZADOS = Object.freeze(['Resolvido', 'Fechado'])
