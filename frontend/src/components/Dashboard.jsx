import './Dashboard.css'

const chamados = [
  {
    id: '#001',
    titulo: 'Computador não conecta à internet',
    categoria: 'Rede',
    prioridade: 'Alta',
    status: 'Aberto',
  },
  {
    id: '#002',
    titulo: 'Erro ao instalar programa',
    categoria: 'Software',
    prioridade: 'Média',
    status: 'Em andamento',
  },
  {
    id: '#003',
    titulo: 'Impressora não reconhecida',
    categoria: 'Hardware',
    prioridade: 'Baixa',
    status: 'Concluído',
  },
]

function Dashboard({ onLogout }) {
  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">RT</div>

          <div>
            <strong>Ronas Desk</strong>
            <span>Central de suporte</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className="menu-item active" type="button">
            <span>⌂</span>
            Visão geral
          </button>

          <button className="menu-item" type="button">
            <span>▤</span>
            Chamados
          </button>

          <button className="menu-item" type="button">
            <span>＋</span>
            Novo chamado
          </button>

          <button className="menu-item" type="button">
            <span>⚙</span>
            Configurações
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">RM</div>

            <div>
              <strong>Ronael Moura</strong>
              <span>Administrador</span>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Painel de controle</p>
            <h1>Olá, Ronael 👋</h1>

            <p>
              Acompanhe os chamados e as atividades recentes do suporte.
            </p>
          </div>

          <button className="new-ticket-button" type="button">
            + Novo chamado
          </button>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <div className="summary-icon blue">▤</div>

            <div>
              <span>Total de chamados</span>
              <strong>12</strong>
              <small>Todos os registros</small>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon red">!</div>

            <div>
              <span>Chamados abertos</span>
              <strong>4</strong>
              <small>Aguardando atendimento</small>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon orange">◷</div>

            <div>
              <span>Em andamento</span>
              <strong>3</strong>
              <small>Sendo analisados</small>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon green">✓</div>

            <div>
              <span>Concluídos</span>
              <strong>5</strong>
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

            <button className="text-button" type="button">
              Ver todos
            </button>
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
                {chamados.map((chamado) => (
                  <tr key={chamado.id}>
                    <td className="ticket-id">{chamado.id}</td>
                    <td className="ticket-title">{chamado.titulo}</td>
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
                      <button className="details-button" type="button">
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard