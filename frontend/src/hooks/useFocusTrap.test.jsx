import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import useFocusTrap from './useFocusTrap'

function ModalDeTeste({ ativo = true, bloquearEscape = false, onEscape, comFocoInicial = false }) {
  const focoInicialRef = useRef(null)
  const modalRef = useFocusTrap({
    ativo,
    bloquearEscape,
    onEscape,
    focoInicialRef: comFocoInicial ? focoInicialRef : undefined,
  })

  return (
    <div>
      <button type="button">fora do modal</button>
      <div ref={modalRef} role="dialog">
        <button type="button" ref={focoInicialRef}>
          primeiro
        </button>
        <button type="button">meio</button>
        <button type="button">ultimo</button>
      </div>
    </div>
  )
}

describe('useFocusTrap', () => {
  it('move o foco para o primeiro elemento focável do modal ao ativar', async () => {
    render(<ModalDeTeste />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'primeiro' })).toHaveFocus(),
    )
  })

  it('move o foco para o elemento indicado em focoInicialRef quando informado', async () => {
    render(<ModalDeTeste comFocoInicial />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'primeiro' })).toHaveFocus(),
    )
  })

  it('não move o foco quando o trap está inativo', async () => {
    render(<ModalDeTeste ativo={false} />)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(screen.getByRole('button', { name: 'primeiro' })).not.toHaveFocus()
  })

  it('envia Tab do último elemento de volta para o primeiro', async () => {
    const usuario = userEvent.setup()
    render(<ModalDeTeste />)

    const primeiro = screen.getByRole('button', { name: 'primeiro' })
    const ultimo = screen.getByRole('button', { name: 'ultimo' })
    await waitFor(() => expect(primeiro).toHaveFocus())

    ultimo.focus()
    await usuario.tab()

    expect(primeiro).toHaveFocus()
  })

  it('envia Shift+Tab do primeiro elemento de volta para o último', async () => {
    const usuario = userEvent.setup()
    render(<ModalDeTeste />)

    const primeiro = screen.getByRole('button', { name: 'primeiro' })
    const ultimo = screen.getByRole('button', { name: 'ultimo' })
    await waitFor(() => expect(primeiro).toHaveFocus())

    await usuario.tab({ shift: true })

    expect(ultimo).toHaveFocus()
  })

  it('chama onEscape ao pressionar Escape quando o escape não está bloqueado', async () => {
    const usuario = userEvent.setup()
    const onEscape = vi.fn()
    render(<ModalDeTeste onEscape={onEscape} />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'primeiro' })).toHaveFocus())
    await usuario.keyboard('{Escape}')

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('não chama onEscape quando bloquearEscape está ativo', async () => {
    const usuario = userEvent.setup()
    const onEscape = vi.fn()
    render(<ModalDeTeste onEscape={onEscape} bloquearEscape />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'primeiro' })).toHaveFocus())
    await usuario.keyboard('{Escape}')

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('restaura o foco ao elemento anterior quando o modal é desmontado', async () => {
    const botaoExterno = document.createElement('button')
    botaoExterno.textContent = 'externo'
    document.body.appendChild(botaoExterno)
    botaoExterno.focus()

    const { unmount } = render(<ModalDeTeste />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'primeiro' })).toHaveFocus())

    unmount()

    expect(botaoExterno).toHaveFocus()
    document.body.removeChild(botaoExterno)
  })
})
