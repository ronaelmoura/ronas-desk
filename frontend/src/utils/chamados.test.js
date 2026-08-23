import { describe, expect, it } from 'vitest'
import { classeChamado } from './chamados'

describe('classeChamado', () => {
  it('converte texto simples em minúsculas separadas por hífen', () => {
    expect(classeChamado('status', 'Em Atendimento')).toBe('status-em-atendimento')
  })

  it('remove acentos ao gerar o sufixo da classe', () => {
    expect(classeChamado('prioridade', 'Crítica')).toBe('prioridade-critica')
    expect(classeChamado('prioridade', 'Média')).toBe('prioridade-media')
  })

  it('substitui sequências de caracteres não alfanuméricos por um único hífen', () => {
    expect(classeChamado('categoria', 'Rede / Acesso')).toBe('categoria-rede-acesso')
  })

  it('remove hífens nas extremidades geradas por caracteres especiais', () => {
    expect(classeChamado('status', '  Cancelado!!')).toBe('status-cancelado')
  })

  it('usa string vazia como padrão quando nenhum valor é informado', () => {
    expect(classeChamado('status')).toBe('status-')
  })

  it('preserva números no sufixo da classe', () => {
    expect(classeChamado('prioridade', 'Nível 2')).toBe('prioridade-nivel-2')
  })
})
