import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DemoGuide from './DemoGuide'

describe('Guia da demonstração', () => {
  it('navega para a próxima tela e mantém progresso ao recolher o guia', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const { rerender } = render(<DemoGuide paginaAtiva="visao-geral" onNavigate={onNavigate} />)
    expect(screen.getByText('1 de 4 telas visitadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Próxima:/ }))
    expect(onNavigate).toHaveBeenCalledWith('chamados')
    rerender(<DemoGuide paginaAtiva="chamados" onNavigate={onNavigate} />)
    expect(screen.getByText('2 de 4 telas visitadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Recolher guia' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mostrar guia' }))
    expect(screen.getByText('2 de 4 telas visitadas')).toBeInTheDocument()
  })

  it('conta apenas as telas do roteiro e conclui sem duplicar visitas', () => {
    const onNavigate = vi.fn()
    const { rerender } = render(<DemoGuide paginaAtiva="visao-geral" onNavigate={onNavigate} />)
    for (const pagina of ['notificacoes', 'chamados', 'clientes', 'visao-geral', 'relatorios']) {
      rerender(<DemoGuide paginaAtiva={pagina} onNavigate={onNavigate} />)
    }
    expect(screen.getByText('4/4 visitadas')).toBeInTheDocument()
    expect(screen.getByText('Roteiro concluído')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Próxima:/ })).not.toBeInTheDocument()
  })
})
