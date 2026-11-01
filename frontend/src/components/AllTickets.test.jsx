import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AllTickets from './AllTickets'
import { listarChamadosApi } from '../services/chamadosApi'

vi.mock('../services/chamadosApi', () => ({ listarChamadosApi: vi.fn() }))
const resultado = { dados: [{ id: 1, titulo: 'Impressora sem conexão', categoria: 'Hardware', prioridade: 'Alta', status: 'Novo' }], paginacao: { total: 1, total_paginas: 1 } }

describe('Experiência da lista de chamados', () => {
  beforeEach(() => { vi.resetAllMocks(); listarChamadosApi.mockResolvedValue(resultado) })

  it('mantém carregamento fora da tabela e não anuncia resultados vazios prematuramente', () => {
    listarChamadosApi.mockReturnValue(new Promise(() => {}))
    render(<AllTickets />)
    expect(screen.getByRole('status')).toHaveTextContent('Atualizando lista')
    expect(screen.queryByText('Nenhum chamado encontrado')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mostra erro fora da tabela e permite tentar novamente mantendo os filtros', async () => {
    listarChamadosApi.mockRejectedValue(new Error('Serviço indisponível'))
    render(<AllTickets filtrosIniciais={{ status: 'Novo' }} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    listarChamadosApi.mockResolvedValue(resultado)
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(listarChamadosApi).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Novo' }))
  })

  it('remove um filtro sem apagar os demais e preserva abertura dos detalhes', async () => {
    const abrir = vi.fn()
    render(<AllTickets onSelectTicket={abrir} filtrosIniciais={{ status: 'Novo', prioridade: 'Alta' }} />)
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Remover filtro Prioridade: Alta' }))
    await waitFor(() => expect(listarChamadosApi).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Novo', prioridade: undefined })))
    expect(screen.getByRole('button', { name: 'Remover filtro Status: Novo' })).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Ver detalhes' })[0])
    expect(abrir).toHaveBeenCalledWith(resultado.dados[0])
  })
})
