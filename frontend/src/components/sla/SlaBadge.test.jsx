import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SlaBadge from './SlaBadge'

describe('SlaBadge', () => {
  it('mostra o texto padrão de indisponibilidade quando nenhum status é informado', () => {
    const { container } = render(<SlaBadge />)

    expect(screen.getByText('SLA indisponível')).toBeInTheDocument()
    expect(container.querySelector('.sla-badge')).toHaveClass('indisponivel')
  })

  it('aplica a classe correspondente para um status conhecido', () => {
    const { container } = render(<SlaBadge status="Vencido" />)

    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(container.querySelector('.sla-badge')).toHaveClass('vencido')
  })

  it('cai para o ícone e a classe padrão diante de um status desconhecido', () => {
    const { container } = render(<SlaBadge status="Status inexistente" />)

    expect(screen.getByText('Status inexistente')).toBeInTheDocument()
    expect(container.querySelector('.sla-badge')).toHaveClass('indisponivel')
  })
})
