import { useState } from "react";
import {
  classeChamado,
  PRIORIDADES_CHAMADOS,
  STATUS_CHAMADOS,
} from "../utils/chamados";
import SlaBadge from "./sla/SlaBadge";
import "./AllTickets.css";

function AllTickets({ chamados, onSelectTicket, onNewTicket }) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroSla, setFiltroSla] = useState("Todos");

  const chamadosFiltrados = chamados.filter((chamado) => {
    const textoBusca = busca.trim().toLowerCase();

    const correspondeBusca =
      !textoBusca ||
      chamado.titulo.toLowerCase().includes(textoBusca) ||
      chamado.descricao.toLowerCase().includes(textoBusca) ||
      chamado.categoria.toLowerCase().includes(textoBusca) ||
      chamado.responsavel_nome?.toLowerCase().includes(textoBusca);

    const correspondeStatus =
      filtroStatus === "Todos" || chamado.status === filtroStatus;

    const correspondePrioridade =
      filtroPrioridade === "Todas" || chamado.prioridade === filtroPrioridade;

    const correspondeCategoria =
      filtroCategoria === "Todas" || chamado.categoria === filtroCategoria;

    const correspondeSla =
      filtroSla === "Todos" || chamado.sla?.status === filtroSla;

    return (
      correspondeBusca &&
      correspondeStatus &&
      correspondePrioridade &&
      correspondeCategoria &&
      correspondeSla
    );
  });

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("Todos");
    setFiltroPrioridade("Todas");
    setFiltroCategoria("Todas");
    setFiltroSla("Todos");
  }

  function formatarId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  return (
    <section className="all-tickets-page">
      <header className="all-tickets-header">
        <div>
          <p className="dashboard-eyebrow">Gerenciamento</p>

          <h1>Todos os chamados</h1>

          <p>Consulte, filtre e acompanhe todas as solicitações.</p>
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
            <label htmlFor="all-ticket-search">Buscar chamado</label>

            <input
              id="all-ticket-search"
              type="search"
              placeholder="Título, descrição ou categoria"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-status-filter">Status</label>

            <select
              id="all-status-filter"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
            >
              <option value="Todos">Todos</option>
              {STATUS_CHAMADOS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-priority-filter">Prioridade</label>

            <select
              id="all-priority-filter"
              value={filtroPrioridade}
              onChange={(event) => setFiltroPrioridade(event.target.value)}
            >
              <option value="Todas">Todas</option>
              {PRIORIDADES_CHAMADOS.map((prioridade) => (
                <option key={prioridade} value={prioridade}>
                  {prioridade}
                </option>
              ))}
            </select>
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-category-filter">Categoria</label>

            <select
              id="all-category-filter"
              value={filtroCategoria}
              onChange={(event) => setFiltroCategoria(event.target.value)}
            >
              <option value="Todas">Todas</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Rede">Rede</option>
              <option value="Acesso">Acesso</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-sla-filter">SLA</label>

            <select
              id="all-sla-filter"
              value={filtroSla}
              onChange={(event) => setFiltroSla(event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Dentro do prazo">Dentro do prazo</option>
              <option value="Próximo do vencimento">
                Próximo do vencimento
              </option>
              <option value="Vencido">Vencido</option>
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
          <strong>{chamadosFiltrados.length}</strong>{" "}
          {chamadosFiltrados.length === 1
            ? "chamado encontrado"
            : "chamados encontrados"}
        </div>

        <div className="ticket-table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Chamado</th>
                <th>Categoria</th>
                <th>Responsável</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>SLA</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {chamadosFiltrados.length > 0 ? (
                chamadosFiltrados.map((chamado) => (
                  <tr key={chamado.id}>
                    <td className="ticket-id">{formatarId(chamado.id)}</td>

                    <td className="ticket-title">{chamado.titulo}</td>

                    <td>{chamado.categoria}</td>

                    <td className="ticket-responsavel">
                      {chamado.responsavel_nome || "Não atribuído"}
                    </td>

                    <td>
                      <span
                        className={`priority ${classeChamado("priority", chamado.prioridade)}`}
                      >
                        {chamado.prioridade}
                      </span>
                    </td>

                    <td>
                      {chamado.sla && <SlaBadge status={chamado.sla.status} />}
                    </td>

                    <td>
                      <span
                        className={`status ${classeChamado("status", chamado.status)}`}
                      >
                        {chamado.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="details-button"
                        type="button"
                        onClick={() => onSelectTicket(chamado)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-table" colSpan="8">
                    Nenhum chamado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default AllTickets;
