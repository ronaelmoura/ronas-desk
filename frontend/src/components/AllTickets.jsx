import { useEffect, useState } from "react";
import { classeChamado, PRIORIDADES_CHAMADOS, STATUS_CHAMADOS } from "../utils/chamados";
import { listarChamadosApi } from "../services/chamadosApi";
import SlaBadge from "./sla/SlaBadge";
import Paginacao from "./ui/Paginacao";
import "./AllTickets.css";

const ITENS_POR_PAGINA = 10;
const CATEGORIAS = ["Hardware", "Software", "Rede", "Acesso", "Outro"];

function AllTickets({ onSelectTicket, onNewTicket, filtrosIniciais, atualizacao }) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroSla, setFiltroSla] = useState("Todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [chamados, setChamados] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

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

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    listarChamadosApi({
      pagina: paginaAtual,
      limite: ITENS_POR_PAGINA,
      busca,
      status: filtroStatus === "Todos" ? undefined : filtroStatus,
      prioridade: filtroPrioridade === "Todas" ? undefined : filtroPrioridade,
      categoria: filtroCategoria === "Todas" ? undefined : filtroCategoria,
      sla_status: filtroSla === "Todos" ? undefined : filtroSla,
      data_inicio: filtroDataInicio || undefined,
      data_fim: filtroDataFim || undefined,
      ordenacao,
    })
      .then((resultado) => {
        if (!ativo) return;
        setChamados(resultado.dados);
        setTotal(resultado.paginacao.total);
        setTotalPaginas(resultado.paginacao.total_paginas);
      })
      .catch((error) => ativo && setErro(error.message))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [atualizacao, busca, filtroCategoria, filtroDataFim, filtroDataInicio, filtroPrioridade, filtroSla, filtroStatus, ordenacao, paginaAtual]);

  useEffect(() => { setPaginaAtual(1); }, [busca, filtroCategoria, filtroDataFim, filtroDataInicio, filtroPrioridade, filtroSla, filtroStatus, ordenacao]);
  useEffect(() => { if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas); }, [paginaAtual, totalPaginas]);

  function limparFiltros() {
    setBusca(""); setFiltroStatus("Todos"); setFiltroPrioridade("Todas");
    setFiltroCategoria("Todas"); setFiltroSla("Todos"); setFiltroDataInicio("");
    setFiltroDataFim(""); setOrdenacao("recentes"); setPaginaAtual(1);
  }

  const primeiroResultado = total ? (paginaAtual - 1) * ITENS_POR_PAGINA + 1 : 0;
  const ultimoResultado = Math.min(paginaAtual * ITENS_POR_PAGINA, total);

  return <section className="all-tickets-page">
    <header className="all-tickets-header"><div><p className="dashboard-eyebrow">Gerenciamento</p><h1>Todos os chamados</h1><p>Consulte, filtre e acompanhe todas as solicitações.</p></div>
      {onNewTicket && <button className="new-ticket-button" type="button" onClick={onNewTicket}>+ Novo chamado</button>}
    </header>
    <section className="all-tickets-panel">
      <div className="all-tickets-filters">
        <div className="all-search-field"><label htmlFor="all-ticket-search">Buscar chamado</label><input id="all-ticket-search" type="search" placeholder="Título, descrição ou categoria" value={busca} onChange={(event) => setBusca(event.target.value)} /></div>
        <div className="all-filter-field"><label htmlFor="all-status-filter">Status</label><select id="all-status-filter" value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)}><option value="Todos">Todos</option>{STATUS_CHAMADOS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="all-filter-field"><label htmlFor="all-priority-filter">Prioridade</label><select id="all-priority-filter" value={filtroPrioridade} onChange={(event) => setFiltroPrioridade(event.target.value)}><option value="Todas">Todas</option>{PRIORIDADES_CHAMADOS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="all-filter-field"><label htmlFor="all-category-filter">Categoria</label><select id="all-category-filter" value={filtroCategoria} onChange={(event) => setFiltroCategoria(event.target.value)}><option value="Todas">Todas</option>{CATEGORIAS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="all-filter-field"><label htmlFor="all-sla-filter">SLA</label><select id="all-sla-filter" value={filtroSla} onChange={(event) => setFiltroSla(event.target.value)}><option value="Todos">Todos</option><option>Dentro do prazo</option><option>Próximo do vencimento</option><option>Vencido</option></select></div>
        <div className="all-filter-field"><label htmlFor="all-start-date-filter">Data inicial</label><input id="all-start-date-filter" type="date" value={filtroDataInicio} onChange={(event) => setFiltroDataInicio(event.target.value)} /></div>
        <div className="all-filter-field"><label htmlFor="all-end-date-filter">Data final</label><input id="all-end-date-filter" type="date" value={filtroDataFim} min={filtroDataInicio || undefined} onChange={(event) => setFiltroDataFim(event.target.value)} /></div>
        <div className="all-filter-field"><label htmlFor="all-order-filter">Ordenar por</label><select id="all-order-filter" value={ordenacao} onChange={(event) => setOrdenacao(event.target.value)}><option value="recentes">Mais recentes</option><option value="antigos">Mais antigos</option><option value="prioridade">Maior prioridade</option></select></div>
        <button className="all-clear-button" type="button" onClick={limparFiltros}>Limpar</button>
      </div>
      <div className="all-tickets-result" role="status" aria-live="polite">{total ? <>Exibindo <strong>{primeiroResultado}</strong>–<strong>{ultimoResultado}</strong> de <strong>{total}</strong> {total === 1 ? "chamado" : "chamados"}</> : "Nenhum chamado encontrado"}</div>
      <div className="ticket-table-wrapper"><table className="ticket-table"><caption className="all-tickets-caption">Chamados encontrados conforme os filtros aplicados</caption><thead><tr><th>ID</th><th>Chamado</th><th>Categoria</th><th>Responsável</th><th>Prioridade</th><th>Status</th><th>SLA</th><th></th></tr></thead><tbody>
        {erro ? <tr><td className="empty-table" colSpan="8">{erro}</td></tr> : carregando ? <tr><td className="empty-table" colSpan="8">Carregando chamados...</td></tr> : chamados.length ? chamados.map((chamado) => <tr key={chamado.id}><td className="ticket-id">#{String(chamado.id).padStart(3, "0")}</td><td className="ticket-title">{chamado.titulo}</td><td>{chamado.categoria}</td><td className="ticket-responsavel">{chamado.responsavel_nome || "Não atribuído"}</td><td><span className={`priority ${classeChamado("priority", chamado.prioridade)}`}>{chamado.prioridade}</span></td><td><span className={`status ${classeChamado("status", chamado.status)}`}>{chamado.status}</span></td><td>{chamado.sla && <SlaBadge status={chamado.sla.status} />}</td><td><button className="details-button" type="button" onClick={() => onSelectTicket(chamado)}>Ver detalhes</button></td></tr>) : <tr><td className="empty-table" colSpan="8">Nenhum chamado encontrado.</td></tr>}
      </tbody></table></div>
      <Paginacao paginaAtual={paginaAtual} totalPaginas={totalPaginas} onChange={setPaginaAtual} ariaLabel="Paginação da lista de chamados" />
    </section>
  </section>;
}

export default AllTickets;
