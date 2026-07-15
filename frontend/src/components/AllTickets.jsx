import { useState } from 'react'
import './AllTickets.css'

function AllTickets({
  chamados,
  onSelectTicket,
  onNewTicket,
}) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroPrioridade, setFiltroPrioridade] =
    useState('Todas')
  const [filtroCategoria, setFiltroCategoria] =
    useState('Todas')

  const chamadosFiltrados = chamados.filter((chamado) => {
    const textoBusca = busca.trim().toLowerCase()

    const correspondeBusca =
      !textoBusca ||
      chamado.titulo.toLowerCase().includes(textoBusca) ||
      chamado.descricao
        .toLowerCase()
        .includes(textoBusca) ||
      chamado.categoria.toLowerCase().includes(textoBusca)

    const correspondeStatus =
      filtroStatus === 'Todos' ||
      chamado.status === filtroStatus

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
    <section className="all-tickets-page">
      <header className="all-tickets-header">
        <div>
          <p className="dashboard-eyebrow">
            Gerenciamento
          </p>

          <h1>Todos os chamados</h1>

          <p>
            Consulte, filtre e acompanhe todas as solicitações.
          </p>
        </div>

        <button
          className="new-ticket-button"
          type="button"
          onClick={onNewTicket}
        >
          + Novo chamado
        </button>
      </header>

      <section className="all-tickets-panel">
        <div className="all-tickets-filters">
          <div className="all-search-field">
            <label htmlFor="all-ticket-search">
              Buscar chamado
            </label>

            <input
              id="all-ticket-search"
              type="search"
              placeholder="Título, descrição ou categoria"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
            />
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-status-filter">
              Status
            </label>

            <select
              id="all-status-filter"
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(event.target.value)
              }
            >
              <option value="Todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">
                Em andamento
              </option>
              <option value="Concluído">
                Concluído
              </option>
            </select>
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-priority-filter">
              Prioridade
            </label>

            <select
              id="all-priority-filter"
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

          <div className="all-filter-field">
            <label htmlFor="all-category-filter">
              Categoria
            </label>

            <select
              id="all-category-filter"
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
            className="all-clear-button"
            type="button"
            onClick={limparFiltros}
          >
            Limpar
          </button>
        </div>

        <div className="all-tickets-result">
          <strong>{chamadosFiltrados.length}</strong>{' '}
          {chamadosFiltrados.length === 1
            ? 'chamado encontrado'
            : 'chamados encontrados'}
        </div>

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
                          onSelectTicket(chamado)
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
                    Nenhum chamado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

export default AllTickets