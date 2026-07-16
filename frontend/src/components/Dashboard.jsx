import { useEffect, useState } from 'react'
import './Dashboard.css'
import NewTicketModal from './NewTicketModal'
import TicketDetailsModal from './TicketDetailsModal'
import AllTickets from './AllTickets'
import ProfileSettings from './ProfileSettings'

const chamadosIniciais = [
  {
    id: 1,
    titulo: 'Computador não conecta à internet',
    categoria: 'Rede',
    prioridade: 'Alta',
    status: 'Aberto',
    descricao:
      'O computador perdeu a conexão com a rede e não encontra nenhuma rede Wi-Fi disponível.',
  },
  {
    id: 2,
    titulo: 'Erro ao instalar programa',
    categoria: 'Software',
    prioridade: 'Média',
    status: 'Em andamento',
    descricao:
      'O instalador apresenta uma mensagem de erro durante a execução e não conclui a instalação.',
  },
  {
    id: 3,
    titulo: 'Impressora não reconhecida',
    categoria: 'Hardware',
    prioridade: 'Baixa',
    status: 'Concluído',
    descricao:
      'A impressora está conectada, mas não aparece entre os dispositivos disponíveis do computador.',
  },
]

const perfilInicial = {
  nome: 'Ronael Moura',
  email: 'ronael@email.com',
  cargo: 'Administrador',
  notificacoes: true,
}

function obterIniciais(nome = '') {
  const nomeSeguro = typeof nome === 'string' ? nome : ''

  return (
    nomeSeguro
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || 'US'
  )
}

function obterPrimeiroNome(nome = '') {
  const nomeSeguro = typeof nome === 'string' ? nome : ''

  return (
    nomeSeguro.trim().split(/\s+/).filter(Boolean)[0] ||
    'Usuário'
  )
}

function carregarPerfil() {
  try {
    const perfilSalvo = localStorage.getItem(
      'ronas-desk-perfil',
    )
  
    if (!perfilSalvo) {
      return perfilInicial
    }

    const perfilConvertido = JSON.parse(perfilSalvo)

    if (
      !perfilConvertido ||
      typeof perfilConvertido !== 'object' ||
      Array.isArray(perfilConvertido)
    ) {
      return perfilInicial
    }

    return {
      nome:
        typeof perfilConvertido.nome === 'string' &&
        perfilConvertido.nome.trim()
          ? perfilConvertido.nome
          : perfilInicial.nome,
      email:
        typeof perfilConvertido.email === 'string' &&
        perfilConvertido.email.trim()
          ? perfilConvertido.email
          : perfilInicial.email,
      cargo:
        typeof perfilConvertido.cargo === 'string' &&
        perfilConvertido.cargo.trim()
          ? perfilConvertido.cargo
          : perfilInicial.cargo,
      notificacoes:
        typeof perfilConvertido.notificacoes === 'boolean'
          ? perfilConvertido.notificacoes
          : perfilInicial.notificacoes,
    }
  } catch {
    return perfilInicial
  }
}

function carregarChamados() {
  try {
    const dadosSalvos = localStorage.getItem('ronas-desk-chamados')

    if (!dadosSalvos) {
      return chamadosIniciais
    }

    const chamadosSalvos = JSON.parse(dadosSalvos)

    return Array.isArray(chamadosSalvos)
      ? chamadosSalvos
      : chamadosIniciais
  } catch {
    return chamadosIniciais
  }
}

function Dashboard({ onLogout }) {
  const [chamados, setChamados] = useState(carregarChamados)
  const [perfil, setPerfil] = useState(carregarPerfil)
  const [modalAberto, setModalAberto] = useState(false)
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null)
  const [paginaAtiva, setPaginaAtiva] = useState('visao-geral')

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState('Todas')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  

  useEffect(() => {
    localStorage.setItem(
      'ronas-desk-chamados',
      JSON.stringify(chamados),
    )
  }, [chamados])

  useEffect(() => {
    localStorage.setItem(
      'ronas-desk-perfil',
      JSON.stringify(perfil),
    )
  }, [perfil])

  const totalChamados = chamados.length

  const chamadosAbertos = chamados.filter(
    (chamado) => chamado.status === 'Aberto',
  ).length

  const chamadosEmAndamento = chamados.filter(
    (chamado) => chamado.status === 'Em andamento',
  ).length

  const chamadosConcluidos = chamados.filter(
    (chamado) => chamado.status === 'Concluído',
  ).length

  const chamadosFiltrados = chamados.filter((chamado) => {
    const textoBusca = busca.trim().toLowerCase()
    const titulo = chamado.titulo?.toLowerCase() ?? ''
    const descricao = chamado.descricao?.toLowerCase() ?? ''
    const categoria = chamado.categoria?.toLowerCase() ?? ''

    const correspondeBusca =
      !textoBusca ||
      titulo.includes(textoBusca) ||
      descricao.includes(textoBusca) ||
      categoria.includes(textoBusca)

    const correspondeStatus =
      filtroStatus === 'Todos' || chamado.status === filtroStatus

    const correspondePrioridade =
      filtroPrioridade === 'Todas' ||
      chamado.prioridade === filtroPrioridade

    const correspondeCategoria =
      filtroCategoria === 'Todas' ||
      chamado.categoria === filtroCategoria

    return (
      correspondeBusca &&
      correspondeStatus &&
      correspondePrioridade &&
      correspondeCategoria
    )
  })

  function criarChamado(dados) {
    const maiorId = chamados.reduce(
      (maior, chamado) => Math.max(maior, chamado.id),
      0,
    )

    const novoChamado = {
      id: maiorId + 1,
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      categoria: dados.categoria,
      prioridade: dados.prioridade,
      status: 'Aberto',
    }

    setChamados((chamadosAtuais) => [
      novoChamado,
      ...chamadosAtuais,
    ])

    setModalAberto(false)
  }

  function atualizarChamado(chamadoAtualizado) {
    setChamados((chamadosAtuais) =>
      chamadosAtuais.map((chamado) =>
        chamado.id === chamadoAtualizado.id
          ? chamadoAtualizado
          : chamado,
      ),
    )

    setChamadoSelecionado(null)
  }

  function excluirChamado(id) {
    setChamados((chamadosAtuais) =>
      chamadosAtuais.filter((chamado) => chamado.id !== id),
    )

    setChamadoSelecionado(null)
  }

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('Todos')
    setFiltroPrioridade('Todas')
    setFiltroCategoria('Todas')
  }

  function formatarId(id) {
    return `#${String(id).padStart(3, '0')}`
  }

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img
            className="sidebar-logo-image"
            src="/logo-ronas-desk.png"
            alt="Logo Ronas Desk"
          />

          <div>
            <strong>Ronas Desk</strong>
            <span>Central de suporte</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${
              paginaAtiva === 'visao-geral' ? 'active' : ''
            }`}
            type="button"
            onClick={() => setPaginaAtiva('visao-geral')}
          >
            <span>⌂</span>
            Visão geral
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === 'chamados' ? 'active' : ''
            }`}
            type="button"
            onClick={() => setPaginaAtiva('chamados')}
          >
            <span>▤</span>
            Chamados
          </button>

          <button
            className="menu-item"
            type="button"
            onClick={() => setModalAberto(true)}
          >
            <span>＋</span>
            Novo chamado
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === 'configuracoes' ? 'active' : ''
            }`}
            type="button"
            onClick={() => setPaginaAtiva('configuracoes')}
          >
            <span>⚙</span>
            Configurações
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {obterIniciais(perfil.nome)}
            </div>

            <div>
              <strong>{perfil.nome}</strong>
              <span>{perfil.cargo}</span>
            </div>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        {paginaAtiva === 'chamados' ? (
          <AllTickets
            chamados={chamados}
            onSelectTicket={setChamadoSelecionado}
            onNewTicket={() => setModalAberto(true)}
          />
        ) : paginaAtiva === 'configuracoes' ? (
          <ProfileSettings
            perfil={perfil}
            onSave={setPerfil}
          />
        ) : (
          <>
            <header className="dashboard-header">
              <div>
                <p className="dashboard-eyebrow">
                  Painel de controle
                </p>

                <h1>
                  Olá, {obterPrimeiroNome(perfil.nome)} 👋
                </h1>

                <p>
                  Acompanhe os chamados e as atividades recentes do
                  suporte.
                </p>
              </div>

              <button
                className="new-ticket-button"
                type="button"
                onClick={() => setModalAberto(true)}
              >
                + Novo chamado
              </button>
            </header>

            <section className="summary-grid">
              <article className="summary-card">
                <div className="summary-icon blue">▤</div>

                <div>
                  <span>Total de chamados</span>
                  <strong>{totalChamados}</strong>
                  <small>Todos os registros</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon red">!</div>

                <div>
                  <span>Chamados abertos</span>
                  <strong>{chamadosAbertos}</strong>
                  <small>Aguardando atendimento</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon orange">◷</div>

                <div>
                  <span>Em andamento</span>
                  <strong>{chamadosEmAndamento}</strong>
                  <small>Sendo analisados</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon green">✓</div>

                <div>
                  <span>Concluídos</span>
                  <strong>{chamadosConcluidos}</strong>
                  <small>Problemas resolvidos</small>
                </div>
              </article>
            </section>

            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Chamados recentes</h2>
                  <p>Últimas solicitações registradas no sistema.</p>
                </div>

                <button
                  className="text-button"
                  type="button"
                  onClick={() => setPaginaAtiva('chamados')}
                >
                  Ver todos
                </button>
              </div>

              <div className="ticket-filters">
                <div className="search-field">
                  <label htmlFor="ticket-search">
                    Buscar chamado
                  </label>

                  <input
                    id="ticket-search"
                    type="search"
                    placeholder="Digite um título, descrição ou categoria"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="status-filter">Status</label>

                  <select
                    id="status-filter"
                    value={filtroStatus}
                    onChange={(event) =>
                      setFiltroStatus(event.target.value)
                    }
                  >
                    <option value="Todos">Todos</option>
                    <option value="Aberto">Aberto</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="priority-filter">Prioridade</label>

                  <select
                    id="priority-filter"
                    value={filtroPrioridade}
                    onChange={(event) =>
                      setFiltroPrioridade(event.target.value)
                    }
                  >
                    <option value="Todas">Todas</option>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="category-filter">Categoria</label>

                  <select
                    id="category-filter"
                    value={filtroCategoria}
                    onChange={(event) =>
                      setFiltroCategoria(event.target.value)
                    }
                  >
                    <option value="Todas">Todas</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Rede">Rede</option>
                    <option value="Acesso">Acesso</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <button
                  className="clear-filters-button"
                  type="button"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </button>
              </div>

              <p className="filter-result">
                {chamadosFiltrados.length}{' '}
                {chamadosFiltrados.length === 1
                  ? 'chamado encontrado'
                  : 'chamados encontrados'}
              </p>

              <div className="ticket-table-wrapper">
                <table className="ticket-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Chamado</th>
                      <th>Categoria</th>
                      <th>Prioridade</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {chamadosFiltrados.length > 0 ? (
                      chamadosFiltrados.map((chamado) => (
                        <tr key={chamado.id}>
                          <td className="ticket-id">
                            {formatarId(chamado.id)}
                          </td>

                          <td className="ticket-title">
                            {chamado.titulo}
                          </td>

                          <td>{chamado.categoria}</td>

                          <td>
                            <span
                              className={`priority priority-${chamado.prioridade.toLowerCase()}`}
                            >
                              {chamado.prioridade}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status status-${chamado.status
                                .toLowerCase()
                                .replace(' ', '-')}`}
                            >
                              {chamado.status}
                            </span>
                          </td>

                          <td>
                            <button
                              className="details-button"
                              type="button"
                              onClick={() =>
                                setChamadoSelecionado(chamado)
                              }
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="empty-table" colSpan="6">
                          Nenhum chamado encontrado com esses filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {modalAberto && (
        <NewTicketModal
          onClose={() => setModalAberto(false)}
          onSave={criarChamado}
        />
      )}

      {chamadoSelecionado && (
        <TicketDetailsModal
          chamado={chamadoSelecionado}
          onClose={() => setChamadoSelecionado(null)}
          onUpdate={atualizarChamado}
          onDelete={excluirChamado}
        />
      )}
    </div>
  )
}

export default Dashboard