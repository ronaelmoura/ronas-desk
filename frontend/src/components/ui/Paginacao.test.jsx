import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Paginacao from './Paginacao'

describe('Paginacao', () => {
  it('não renderiza nada quando há uma página ou menos', () => {
    const { container } = render(
      <Paginacao paginaAtual={1} totalPaginas={1} onChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza todas as páginas sequencialmente quando o total é pequeno', () => {
    render(<Paginacao paginaAtual={2} totalPaginas={5} onChange={vi.fn()} />)

    for (let pagina = 1; pagina <= 5; pagina += 1) {
      expect(
        screen.getByRole('button', { name: `Ir para a página ${pagina}` }),
      ).toBeInTheDocument()
    }
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('usa reticências para omitir páginas distantes quando o total é grande', () => {
    render(<Paginacao paginaAtual={10} totalPaginas={20} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Ir para a página 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para a página 9' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para a página 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para a página 11' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para a página 20' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ir para a página 5' })).not.toBeInTheDocument()
    expect(screen.getAllByText('…').length).toBeGreaterThan(0)
  })

  it('marca a página atual com aria-current e desabilita os limites', () => {
    render(<Paginacao paginaAtual={1} totalPaginas={3} onChange={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Ir para a página 1' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toBeDisabled()
  })

  it('desabilita o botão de próxima página quando está na última página', () => {
    render(<Paginacao paginaAtual={3} totalPaginas={3} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('chama onChange com o número da página clicada', async () => {
    const usuario = userEvent.setup()
    const onChange = vi.fn()
    render(<Paginacao paginaAtual={2} totalPaginas={5} onChange={onChange} />)

    await usuario.click(screen.getByRole('button', { name: 'Ir para a página 4' }))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('chama onChange com a página anterior e a próxima a partir dos botões de navegação', async () => {
    const usuario = userEvent.setup()
    const onChange = vi.fn()
    render(<Paginacao paginaAtual={2} totalPaginas={5} onChange={onChange} />)

    await usuario.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onChange).toHaveBeenCalledWith(1)

    await usuario.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
