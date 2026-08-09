import { useEffect, useMemo, useState } from "react";
import {
  classeChamado,
  PRIORIDADES_CHAMADOS,
  STATUS_CHAMADOS,
} from "../utils/chamados";
import SlaBadge from "./sla/SlaBadge";
import Paginacao from "./ui/Paginacao";
import "./AllTickets.css";

const ITENS_POR_PAGINA = 10;

const PESOS_PRIORIDADE = {
  Crítica: 4,
  Alta: 3,
  Média: 2,
  Baixa: 1,
};

const PESOS_SLA = {
  Vencido: 3,
  "Próximo do vencimento": 2,
  "Dentro do prazo": 1,
};

function obterTimestamp(valor) {
  const timestamp = new Date(valor).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compararMaisRecentes(chamadoA, chamadoB) {
  const diferenca =
    obterTimestamp(chamadoB.created_at) - obterTimestamp(chamadoA.created_at);

  return diferenca || Number(chamadoB.id) - Number(chamadoA.id);
}

function ordenarChamados(chamados, ordenacao) {
  return [...chamados].sort((chamadoA, chamadoB) => {
    if (ordenacao === "antigos") {
      return -compararMaisRecentes(chamadoA, chamadoB);
    }

    if (ordenacao === "prioridade") {
      return (
        (PESOS_PRIORIDADE[chamadoB.prioridade] ?? 0) -
          (PESOS_PRIORIDADE[chamadoA.prioridade] ?? 0) ||
        compararMaisRecentes(chamadoA, chamadoB)
      );
    }

    if (ordenacao === "sla") {
      return (
        (PESOS_SLA[chamadoB.sla?.status] ?? 0) -
          (PESOS_SLA[chamadoA.sla?.status] ?? 0) ||
        (chamadoB.sla?.percentage ?? 0) -
          (chamadoA.sla?.percentage ?? 0) ||
        compararMaisRecentes(chamadoA, chamadoB)
      );
    }

    return compararMaisRecentes(chamadoA, chamadoB);
  });
}

function AllTickets({
  chamados,
  onSelectTicket,
  onNewTicket,
  filtrosIniciais,
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroSla, setFiltroSla] = useState("Todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    setBusca(filtrosIniciais?.busca ?? "");
    setFiltroStatus(filtrosIniciais?.status ?? "Todos");
    setFiltroPrioridade(filtrosIniciais?.prioridade ?? "Todas");
    setFiltroCategoria(filtrosIniciais?.categoria ?? "Todas");
    setFiltroSla(filtrosIniciais?.sla ?? "Todos");
    setFiltroDataInicio(filtrosIniciais?.data_inicio ?? "");
    setFiltroDataFim(filtrosIniciais?.data_fim ?? "");
    setOrdenacao(filtrosIniciais?.ordenacao ?? "recentes");
    setPaginaAtual(1);
  }, [filtrosIniciais]);

  const categorias = useMemo(
    () =>
      [...new Set(chamados.map((chamado) => chamado.categoria).filter(Boolean))]
        .sort((categoriaA, categoriaB) =>
          categoriaA.localeCompare(categoriaB, "pt-BR"),
        ),
    [chamados],
  );

  const chamadosFiltrados = useMemo(() => {
    const textoBusca = busca.trim().toLocaleLowerCase("pt-BR");

    const filtrados = chamados.filter((chamado) => {
      const camposBusca = [
        chamado.titulo,
        chamado.descricao,
        chamado.categoria,
        chamado.responsavel_nome,
      ];

      const correspondeBusca =
        !textoBusca ||
        camposBusca.some((campo) =>
          String(campo ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(textoBusca),
        );

      const correspondeStatus =
        filtroStatus === "Todos" || chamado.status === filtroStatus;

      const correspondePrioridade =
        filtroPrioridade === "Todas" || chamado.prioridade === filtroPrioridade;

      const correspondeCategoria =
        filtroCategoria === "Todas" || chamado.categoria === filtroCategoria;

      const correspondeSla =
        filtroSla === "Todos" || chamado.sla?.status === filtroSla;

      const criadoEm = new Date(chamado.created_at);

      const inicio = filtroDataInicio
        ? new Date(`${filtroDataInicio}T00:00:00`)
        : null;

      const fimExclusivo = filtroDataFim
        ? new Date(`${filtroDataFim}T00:00:00`)
        : null;

      if (fimExclusivo) {
        fimExclusivo.setDate(fimExclusivo.getDate() + 1);
      }

      const correspondePeriodo =
        !Number.isNaN(criadoEm.getTime()) &&
        (!inicio || criadoEm >= inicio) &&
        (!fimExclusivo || criadoEm < fimExclusivo);

      return (
        correspondeBusca &&
        correspondeStatus &&
        correspondePrioridade &&
        correspondeCategoria &&
        correspondeSla &&
        correspondePeriodo
      );
    });

    return ordenarChamados(filtrados, ordenacao);
  }, [
    busca,
    chamados,
    filtroCategoria,
    filtroPrioridade,
    filtroSla,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
    ordenacao,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(chamadosFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const indiceInicial = (paginaSegura - 1) * ITENS_POR_PAGINA;
  const chamadosDaPagina = chamadosFiltrados.slice(
    indiceInicial,
    indiceInicial + ITENS_POR_PAGINA,
  );
  const primeiroResultado = chamadosFiltrados.length ? indiceInicial + 1 : 0;
  const ultimoResultado = Math.min(
    indiceInicial + ITENS_POR_PAGINA,
    chamadosFiltrados.length,
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    filtroCategoria,
    filtroPrioridade,
    filtroSla,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
    ordenacao,
  ]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("Todos");
    setFiltroPrioridade("Todas");
    setFiltroCategoria("Todas");
    setFiltroSla("Todos");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setOrdenacao("recentes");
    setPaginaAtual(1);
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
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
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

          <div className="all-filter-field">
            <label htmlFor="all-start-date-filter">Data inicial</label>
            <input
              id="all-start-date-filter"
              type="date"
              value={filtroDataInicio}
              onChange={(event) => setFiltroDataInicio(event.target.value)}
            />
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-end-date-filter">Data final</label>
            <input
              id="all-end-date-filter"
              type="date"
              value={filtroDataFim}
              min={filtroDataInicio || undefined}
              onChange={(event) => setFiltroDataFim(event.target.value)}
            />
          </div>

          <div className="all-filter-field">
            <label htmlFor="all-order-filter">Ordenar por</label>

            <select
              id="all-order-filter"
              value={ordenacao}
              onChange={(event) => setOrdenacao(event.target.value)}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="prioridade">Maior prioridade</option>
              <option value="sla">Maior risco de SLA</option>
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

        <div className="all-tickets-result" role="status" aria-live="polite">
          {chamadosFiltrados.length ? (
            <>
              Exibindo <strong>{primeiroResultado}</strong>–
              <strong>{ultimoResultado}</strong> de{" "}
              <strong>{chamadosFiltrados.length}</strong>{" "}
              {chamadosFiltrados.length === 1 ? "chamado" : "chamados"}
            </>
          ) : (
            "Nenhum chamado encontrado"
          )}
        </div>

        <div className="ticket-table-wrapper">
          <table className="ticket-table">
            <caption className="all-tickets-caption">
              Chamados encontrados conforme os filtros aplicados
            </caption>
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
              {chamadosDaPagina.length > 0 ? (
                chamadosDaPagina.map((chamado) => (
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
                      <span
                        className={`status ${classeChamado("status", chamado.status)}`}
                      >
                        {chamado.status}
                      </span>
                    </td>

                    <td>
                      {chamado.sla && <SlaBadge status={chamado.sla.status} />}
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

        <Paginacao
          paginaAtual={paginaSegura}
          totalPaginas={totalPaginas}
          onChange={setPaginaAtual}
          ariaLabel="Paginação da lista de chamados"
        />
      </section>
    </section>
  );
}

export default AllTickets;
