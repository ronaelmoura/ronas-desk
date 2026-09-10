import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
import { buscarDashboardApi } from '../services/dashboardApi'
import { IDENTIDADE_PADRAO } from '../context/companyBrandDefaults'

vi.mock('../hooks/useAuth', () => ({ default: () => ({ usuario: { nome: 'Visitante Demo', cargo: 'Atendente', is_demo: true } }) }))
vi.mock('../hooks/useCompanyBrand', () => ({ default: () => ({ configuracao: IDENTIDADE_PADRAO }) }))
vi.mock('../services/dashboardApi', () => ({ buscarDashboardApi: vi.fn() }))
vi.mock('../services/visitasApi', () => ({ registrarVisitaApi: vi.fn().mockResolvedValue({}) }))
vi.mock('./AllTickets', () => ({ default: ({ filtrosIniciais }) => <h1>Filtro: {filtrosIniciais?.status || 'Todos'}</h1> }))

const dados = {
  total_clientes: 8, total_usuarios: 6, total_chamados: 17,
  chamados_novos: 2, chamados_em_atendimento: 3, chamados_aguardando_cliente: 2,
  chamados_resolvidos: 6, chamados_fechados: 3, chamados_cancelados: 1,
  chamados_criticos: 2, sla_vencidos: 8, sla_proximos_vencimento: 0,
  tempo_medio_resolucao_minutos: null, tempo_medio_primeira_resposta_minutos: null,
  chamados_recentes: [],
}

describe('Dashboard: navegação e distribuição completa', () => {
  beforeEach(() => {
    buscarDashboardApi.mockResolvedValue(dados)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
  })

  it('inclui fechados e cancelados no total do gráfico e no filtro de status', async () => {
    const user = userEvent.setup()
    render(<Dashboard onLogout={vi.fn()} />)
    expect(await screen.findByRole('img', { name: '17 chamados distribuídos por status' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Fechados/ }))
    expect(await screen.findByRole('heading', { name: 'Filtro: Fechado' })).toBeInTheDocument()
  })

  it('fecha o menu móvel após navegação e leva o foco ao conteúdo', async () => {
    const user = userEvent.setup()
    render(<Dashboard onLogout={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Visão geral do suporte' })
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Chamados', exact: true }))
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.queryByRole('button', { name: /Novo chamado/ })).not.toBeInTheDocument()
  })

  it('permite fechar o menu com Escape sem perder o foco', async () => {
    const user = userEvent.setup()
    render(<Dashboard onLogout={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Visão geral do suporte' })
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    screen.getByRole('button', { name: 'Visão geral', exact: true }).focus()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})

