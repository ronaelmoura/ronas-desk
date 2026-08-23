import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SlaCard from './SlaCard'

describe('SlaCard', () => {
  it('exibe apenas o indicador de indisponibilidade quando não há dados de SLA', () => {
    render(<SlaCard sla={null} />)

    expect(screen.getByText('SLA indisponível')).toBeInTheDocument()
    expect(screen.queryByText('Consumo do prazo')).not.toBeInTheDocument()
  })

  it('mostra o tempo restante formatado em dias e horas para chamados em dia', () => {
    render(
      <SlaCard
        sla={{
          status: 'Dentro do prazo',
          percentage: 40,
          displayPercentage: 40,
          isOverdue: false,
          isResolved: false,
          remainingMinutes: 1500,
          elapsedMinutes: 30,
          dueAt: null,
        }}
      />,
    )

    expect(screen.getByText('Dentro do prazo')).toBeInTheDocument()
    expect(screen.getByText('1d 1h restantes')).toBeInTheDocument()
    expect(screen.getByText('30min')).toBeInTheDocument()
  })

  it('mostra "Vencido há" quando o chamado já ultrapassou o prazo', () => {
    render(
      <SlaCard
        sla={{
          status: 'Vencido',
          percentage: 130,
          displayPercentage: 100,
          isOverdue: true,
          isResolved: false,
          remainingMinutes: 90,
          elapsedMinutes: 600,
          dueAt: null,
        }}
      />,
    )

    expect(screen.getByText('Vencido há 1h 30min')).toBeInTheDocument()
  })

  it('mostra a data prevista de vencimento quando o chamado já foi resolvido', () => {
    render(
      <SlaCard
        sla={{
          status: 'Dentro do prazo',
          percentage: 60,
          displayPercentage: 60,
          isOverdue: false,
          isResolved: true,
          remainingMinutes: 120,
          elapsedMinutes: 240,
          dueAt: '2026-01-05T10:00:00.000Z',
        }}
      />,
    )

    expect(screen.getByText('Vencimento previsto')).toBeInTheDocument()
    expect(screen.queryByText(/restantes$/)).not.toBeInTheDocument()
  })

  it('trata datas de vencimento inválidas com uma mensagem amigável', () => {
    render(
      <SlaCard
        sla={{
          status: 'Dentro do prazo',
          percentage: 10,
          displayPercentage: 10,
          isOverdue: false,
          isResolved: true,
          remainingMinutes: 0,
          elapsedMinutes: 5,
          dueAt: 'data-invalida',
        }}
      />,
    )

    expect(screen.getByText('Ainda não disponível')).toBeInTheDocument()
  })

  it('limita a barra de progresso a no máximo 100%, mesmo com percentuais acima disso', () => {
    render(
      <SlaCard
        sla={{
          status: 'Vencido',
          percentage: 250,
          displayPercentage: 250,
          isOverdue: true,
          isResolved: false,
          remainingMinutes: 5,
          elapsedMinutes: 5,
          dueAt: null,
        }}
      />,
    )

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})
