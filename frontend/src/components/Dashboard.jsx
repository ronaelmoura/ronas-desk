import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Ban,
  BellRing,
  ChartNoAxesColumn,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  Clock3,
  Gauge,
  Globe2,
  House,
  MessageCircle,
  MessageSquareHeart,
  MonitorPlay,
  Settings,
  ShieldAlert,
  Timer,
  TimerOff,
  Tickets,
  UserCog,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import "./Dashboard.css";
import NewTicketModal from "./NewTicketModal";
import TicketDetailsModal from "./TicketDetailsModal";
import AllTickets from "./AllTickets";
import ProfileSettings from "./ProfileSettings";
import Clientes from "../pages/Clientes/clientes";
import Usuarios from "../pages/Usuarios/Usuarios";
import Relatorios from "../pages/Relatorios/Relatorios";
import Visitas from "../pages/Visitas/Visitas";
import Notificacoes from "../pages/Notificacoes/Notificacoes";
import Avaliacoes from "../pages/Avaliacoes/Avaliacoes";
import Toast from "./ui/Toast";
import useAuth from "../hooks/useAuth";
import useCompanyBrand from "../hooks/useCompanyBrand";
import {
  criarChamadoApi,
  excluirChamadoApi,
  atualizarChamadoApi,
} from "../services/chamadosApi";
import { buscarDashboardApi } from "../services/dashboardApi";
import { registrarVisitaApi } from "../services/visitasApi";
import { classeChamado } from "../utils/chamados";
import { usarLogoPadrao } from "../utils/companyBrand";

const dashboardInicial = {
  total_clientes: 0,
  total_usuarios: 0,
  total_chamados: 0,
  chamados_novos: 0,
  chamados_em_atendimento: 0,
  chamados_aguardando_cliente: 0,
  chamados_resolvidos: 0,
  chamados_fechados: 0,
  chamados_cancelados: 0,
  chamados_criticos: 0,
  sla_vencidos: 0,
  sla_proximos_vencimento: 0,
  tempo_medio_resolucao_minutos: null,
  tempo_medio_primeira_resposta_minutos: null,
  chamados_recentes: [],
};

function obterIniciais(nome = "") {
  const nomeSeguro = typeof nome === "string" ? nome : "";

  return (
    nomeSeguro
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "US"
  );
}

function obterPrimeiroNome(nome = "") {
  const nomeSeguro = typeof nome === "string" ? nome : "";

  return nomeSeguro.trim().split(/\s+/).filter(Boolean)[0] || "Usuário";
}

function formatarTempoMedio(minutos) {
  if (!Number.isFinite(minutos)) return "Ainda não disponível";
  const totalMinutos = Math.max(0, Math.round(minutos));
  if (totalMinutos < 60) return `${totalMinutos}min`;

  const horas = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

function Dashboard({ onLogout }) {
  const { usuario } = useAuth();
  const { configuracao } = useCompanyBrand();
  const somenteLeitura = Boolean(usuario?.is_demo);
  const administrador = usuario?.cargo === "Administrador";
  const [dashboard, setDashboard] = useState(dashboardInicial);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState("");
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [erroDashboard, setErroDashboard] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [paginaAtiva, setPaginaAtiva] = useState("visao-geral");
  const [toast, setToast] = useState(null);
  const [periodoDashboard, setPeriodoDashboard] = useState({ tipo: "todo" });
  const [filtroInicialChamados, setFiltroInicialChamados] = useState(null);
  const [atualizacaoChamados, setAtualizacaoChamados] = useState(0);

  useEffect(() => {
    if (usuario?.is_demo) {
      registrarVisitaApi(paginaAtiva).catch(() => {});
    }
  }, [paginaAtiva, usuario?.is_demo]);

  const fecharToast = useCallback(() => setToast(null), []);

  const periodoPersonalizadoIncompleto =
    periodoDashboard.tipo === "personalizado" &&
    (!periodoDashboard.data_inicio || !periodoDashboard.data_fim);
  const periodoPersonalizadoInvertido =
    periodoDashboard.tipo === "personalizado" &&
    periodoDashboard.data_inicio &&
    periodoDashboard.data_fim &&
    periodoDashboard.data_inicio > periodoDashboard.data_fim;
  const mensagemErroPeriodo = periodoPersonalizadoIncompleto
    ? "Informe a data inicial e a data final."
    : periodoPersonalizadoInvertido
      ? "A data inicial não pode ser posterior à data final."
      : "";

  function normalizarPeriodoDashboard(periodo) {
    if (!periodo || periodo.tipo === "todo") {
      return null;
    }

    const hoje = new Date();
    const formatarDataLocal = (data) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const dia = String(data.getDate()).padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    };

    if (periodo.tipo === "personalizado") {
      return periodo.data_inicio && periodo.data_fim
        ? {
            data_inicio: periodo.data_inicio,
            data_fim: periodo.data_fim,
          }
        : null;
    }

    const dias =
      periodo.tipo === "7"
        ? 7
        : periodo.tipo === "30"
        ? 30
        : periodo.tipo === "90"
        ? 90
        : null;

    if (!dias) {
      return null;
    }

    const dataFim = formatarDataLocal(hoje);
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - (dias - 1));

    return {
      data_inicio: formatarDataLocal(dataInicio),
      data_fim: dataFim,
    };
  }

  function obterFiltrosPeriodoAtual() {
    const periodo = normalizarPeriodoDashboard(periodoDashboard);

    return periodo
      ? {
          data_inicio: periodo.data_inicio,
          data_fim: periodo.data_fim,
        }
      : {};
  }

  function recarregarDashboardAtual() {
    return carregarDashboardDaApi(
      normalizarPeriodoDashboard(periodoDashboard),
    );
  }

  useEffect(() => {
    if (mensagemErroPeriodo) {
      return;
    }

    const periodoNormalizado = normalizarPeriodoDashboard(periodoDashboard);
    carregarDashboardDaApi(periodoNormalizado);
  }, [periodoDashboard, mensagemErroPeriodo]);

  async function carregarChamadosDaApi() {
    setCarregando(true);
    setErroApi("");
    setCarregando(false);
  }

  async function carregarDashboardDaApi(periodo = null) {
    setCarregandoDashboard(true);
    setErroDashboard("");

    try {
      const dados = await buscarDashboardApi(periodo);
      setDashboard(dados);
    } catch (error) {
      setErroDashboard(error.message);
    } finally {
      setCarregandoDashboard(false);
    }
  }

  function abrirVisaoGeral() {
    setPaginaAtiva("visao-geral");
  }

  function abrirChamados() {
    const filtrosPeriodo = obterFiltrosPeriodoAtual();

    setPaginaAtiva("chamados");
    setFiltroInicialChamados(
      Object.keys(filtrosPeriodo).length ? filtrosPeriodo : null,
    );
    carregarChamadosDaApi();
  }

  function abrirChamadosComFiltro(filtros) {
    const filtrosCompletos = {
      ...obterFiltrosPeriodoAtual(),
      ...(filtros || {}),
    };

    setFiltroInicialChamados(
      Object.keys(filtrosCompletos).length ? filtrosCompletos : null,
    );
    setPaginaAtiva("chamados");
    carregarChamadosDaApi();
  }

  async function criarChamado(dados) {
    await criarChamadoApi(dados);

    setAtualizacaoChamados((atual) => atual + 1);

    setModalAberto(false);
    recarregarDashboardAtual();
    setToast({ tipo: "sucesso", mensagem: "Chamado aberto com sucesso." });
  }

  async function atualizarChamado(chamadoAtualizado) {
    await atualizarChamadoApi(
      chamadoAtualizado.id,
      chamadoAtualizado,
    );


    setChamadoSelecionado(null);
    setAtualizacaoChamados((atual) => atual + 1);
    recarregarDashboardAtual();
    setToast({
      tipo: "sucesso",
      mensagem: "Chamado atualizado com sucesso.",
    });
  }

  async function excluirChamado(id) {
    await excluirChamadoApi(id);


    setChamadoSelecionado(null);
    setAtualizacaoChamados((atual) => atual + 1);
    recarregarDashboardAtual();
    setToast({ tipo: "sucesso", mensagem: "Chamado excluído com sucesso." });
  }

  function formatarId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img
            className="sidebar-logo-image"
            src={configuracao.logo_url || "/brand-mark.svg"}
            alt={`Logo ${configuracao.nome_empresa}`}
            onError={usarLogoPadrao}
          />

          <div>
            <strong>{configuracao.nome_empresa}</strong>
            <span>{configuracao.nome_central}</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${
              paginaAtiva === "visao-geral" ? "active" : ""
            }`}
            type="button"
            onClick={abrirVisaoGeral}
            aria-current={paginaAtiva === "visao-geral" ? "page" : undefined}
          >
            <House className="menu-item-icon" aria-hidden="true" />
            Visão geral
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "clientes" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("clientes")}
            aria-current={paginaAtiva === "clientes" ? "page" : undefined}
          >
            <UsersRound className="menu-item-icon" aria-hidden="true" />
            Clientes
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "chamados" ? "active" : ""
            }`}
            type="button"
            onClick={abrirChamados}
            aria-current={paginaAtiva === "chamados" ? "page" : undefined}
          >
            <Tickets className="menu-item-icon" aria-hidden="true" />
            Chamados
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "notificacoes" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("notificacoes")}
            aria-current={paginaAtiva === "notificacoes" ? "page" : undefined}
          >
            <BellRing className="menu-item-icon" aria-hidden="true" />
            Notificações
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "usuarios" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("usuarios")}
            aria-current={paginaAtiva === "usuarios" ? "page" : undefined}
          >
            <UserCog className="menu-item-icon" aria-hidden="true" />
            Usuários
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "relatorios" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("relatorios")}
            aria-current={paginaAtiva === "relatorios" ? "page" : undefined}
          >
            <ChartNoAxesColumn
              className="menu-item-icon"
              aria-hidden="true"
            />
            Relatórios
          </button>

          {usuario?.cargo === "Administrador" && !somenteLeitura && (
            <button
              className={`menu-item ${
                paginaAtiva === "avaliacoes" ? "active" : ""
              }`}
              type="button"
              onClick={() => setPaginaAtiva("avaliacoes")}
              aria-current={paginaAtiva === "avaliacoes" ? "page" : undefined}
            >
              <MessageSquareHeart className="menu-item-icon" aria-hidden="true" />
              Avaliações
            </button>
          )}

          {usuario?.cargo === "Administrador" && !somenteLeitura && (
            <button
              className={`menu-item ${
                paginaAtiva === "visitas" ? "active" : ""
              }`}
              type="button"
              onClick={() => setPaginaAtiva("visitas")}
              aria-current={paginaAtiva === "visitas" ? "page" : undefined}
            >
              <Globe2 className="menu-item-icon" aria-hidden="true" />
              Visitas
            </button>
          )}

          {!somenteLeitura && (
            <button
              className="menu-item"
              type="button"
              onClick={() => setModalAberto(true)}
            >
              <CirclePlus className="menu-item-icon" aria-hidden="true" />
              Novo chamado
            </button>
          )}

          {!somenteLeitura && (
            <button
            className={`menu-item ${
              paginaAtiva === "configuracoes" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("configuracoes")}
            aria-current={paginaAtiva === "configuracoes" ? "page" : undefined}
          >
            <Settings className="menu-item-icon" aria-hidden="true" />
            Configurações
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{obterIniciais(usuario?.nome)}</div>

            <div>
              <strong>{usuario?.nome}</strong>
              <span>{usuario?.cargo}</span>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        {somenteLeitura && (
          <div className="demo-mode-banner" role="status">
            <MonitorPlay aria-hidden="true" />
            <div>
              <strong>Você está explorando a demonstração</strong>
              <span>Os dados são reais da demonstração e estão protegidos contra alterações.</span>
            </div>
          </div>
        )}
        {paginaAtiva === "clientes" ? (
          <Clientes
            onSelectTicket={setChamadoSelecionado}
            somenteLeitura={somenteLeitura}
            administrador={administrador}
          />
        ) : paginaAtiva === "usuarios" ? (
          <Usuarios administrador={usuario?.cargo === "Administrador"} />
        ) : paginaAtiva === "relatorios" ? (
          <Relatorios />
        ) : paginaAtiva === "notificacoes" ? (
          <Notificacoes />
        ) : paginaAtiva === "avaliacoes" &&
          usuario?.cargo === "Administrador" &&
          !somenteLeitura ? (
          <Avaliacoes />
        ) : paginaAtiva === "visitas" &&
          usuario?.cargo === "Administrador" &&
          !somenteLeitura ? (
          <Visitas />
        ) : paginaAtiva === "chamados" ? (
          carregando ? (
            <section className="dashboard-panel">
              <h2>Carregando chamados...</h2>
              <p>Aguarde enquanto o Ronas Desk consulta a API.</p>
            </section>
          ) : erroApi ? (
            <section className="dashboard-panel">
              <h2>Não foi possível carregar os chamados</h2>
              <p>{erroApi}</p>

              <button
                className="new-ticket-button"
                type="button"
                onClick={carregarChamadosDaApi}
              >
                Tentar novamente
              </button>
            </section>
          ) : (
            <AllTickets
              onSelectTicket={setChamadoSelecionado}
              onNewTicket={somenteLeitura ? null : () => setModalAberto(true)}
              filtrosIniciais={filtroInicialChamados}
              atualizacao={atualizacaoChamados}
            />
          )
        ) : paginaAtiva === "configuracoes" ? (
          <ProfileSettings />
        ) : carregandoDashboard ? (
          <section
            className="dashboard-skeleton"
            aria-label="Carregando dashboard"
          >
            <div className="dashboard-skeleton-header">
              <span />
              <span />
            </div>
            <div className="summary-grid">
              {Array.from({ length: 14 }, (_, indice) => (
                <div className="summary-card skeleton-card" key={indice}>
                  <span />
                  <div>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : erroDashboard ? (
          <section className="dashboard-panel">
            <h2>Não foi possível carregar o dashboard</h2>
            <p>{erroDashboard}</p>

            <button
              className="new-ticket-button"
              type="button"
              onClick={recarregarDashboardAtual}
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <>
            <header className="dashboard-header">
              <div>
                <p className="dashboard-eyebrow">Painel de controle</p>

                <h1>Olá, {obterPrimeiroNome(usuario?.nome)} 👋</h1>

                <p>
                  Acompanhe os chamados e as atividades recentes do suporte.
                </p>

                <div className="dashboard-period-selector">
                  <label
                    className="dashboard-period-control"
                    htmlFor="periodo-dashboard"
                  >
                    <span>Período</span>
                    <select
                      id="periodo-dashboard"
                      value={periodoDashboard.tipo}
                      onChange={(event) => {
                        const tipo = event.target.value;
                        setPeriodoDashboard((atual) => ({
                          tipo,
                          data_inicio:
                            tipo === "personalizado"
                              ? atual.data_inicio
                              : undefined,
                          data_fim:
                            tipo === "personalizado"
                              ? atual.data_fim
                              : undefined,
                        }));
                      }}
                    >
                      <option value="todo">Todo o período</option>
                      <option value="7">Últimos 7 dias</option>
                      <option value="30">Últimos 30 dias</option>
                      <option value="90">Últimos 90 dias</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </label>

                  {periodoDashboard.tipo === "personalizado" && (
                    <div className="periodo-personalizado-inputs">
                      <label>
                        Data início
                        <input
                          type="date"
                          value={periodoDashboard.data_inicio || ""}
                          max={periodoDashboard.data_fim || undefined}
                          aria-invalid={Boolean(mensagemErroPeriodo)}
                          aria-describedby="periodo-dashboard-feedback"
                          onChange={(event) =>
                            setPeriodoDashboard((atual) => ({
                              ...atual,
                              data_inicio: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        Data fim
                        <input
                          type="date"
                          value={periodoDashboard.data_fim || ""}
                          min={periodoDashboard.data_inicio || undefined}
                          aria-invalid={Boolean(mensagemErroPeriodo)}
                          aria-describedby="periodo-dashboard-feedback"
                          onChange={(event) =>
                            setPeriodoDashboard((atual) => ({
                              ...atual,
                              data_fim: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}

                  {mensagemErroPeriodo && (
                    <p
                      id="periodo-dashboard-feedback"
                      className="dashboard-period-feedback"
                      role="alert"
                    >
                      {mensagemErroPeriodo}
                    </p>
                  )}
                </div>
              </div>

              {!somenteLeitura && (
                <button
                  className="new-ticket-button"
                  type="button"
                  onClick={() => setModalAberto(true)}
                >
                  + Novo chamado
                </button>
              )}

            </header>

            <section className="summary-grid">
              <button
                className="summary-card"
                type="button"
                aria-label="Ver todos os chamados"
                onClick={abrirChamados}
              >
                <div className="summary-icon blue">
                  <Tickets aria-hidden="true" />
                </div>

                <div>
                  <span>Total de chamados</span>
                  <strong>{dashboard.total_chamados}</strong>
                  <small>Todos os registros</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados novos"
                onClick={() => abrirChamadosComFiltro({ status: "Novo" })}
              >
                <div className="summary-icon red">
                  <CircleAlert aria-hidden="true" />
                </div>

                <div>
                  <span>Novos</span>
                  <strong>{dashboard.chamados_novos}</strong>
                  <small>Aguardando atendimento</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados em atendimento"
                onClick={() => abrirChamadosComFiltro({ status: "Em Atendimento" })}
              >
                <div className="summary-icon orange">
                  <Clock3 aria-hidden="true" />
                </div>

                <div>
                  <span>Em atendimento</span>
                  <strong>{dashboard.chamados_em_atendimento}</strong>
                  <small>Em análise pela equipe</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados aguardando cliente"
                onClick={() => abrirChamadosComFiltro({ status: "Aguardando Cliente" })}
              >
                <div className="summary-icon green">
                  <UserRoundCheck aria-hidden="true" />
                </div>

                <div>
                  <span>Aguardando cliente</span>
                  <strong>{dashboard.chamados_aguardando_cliente}</strong>
                  <small>Pendentes de retorno</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados resolvidos"
                onClick={() => abrirChamadosComFiltro({ status: "Resolvido" })}
              >
                <div className="summary-icon green">
                  <CircleCheck aria-hidden="true" />
                </div>

                <div>
                  <span>Resolvidos</span>
                  <strong>{dashboard.chamados_resolvidos}</strong>
                  <small>Solução aplicada</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados fechados"
                onClick={() => abrirChamadosComFiltro({ status: "Fechado" })}
              >
                <div className="summary-icon purple">
                  <Archive aria-hidden="true" />
                </div>

                <div>
                  <span>Fechados</span>
                  <strong>{dashboard.chamados_fechados}</strong>
                  <small>Atendimentos encerrados</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados cancelados"
                onClick={() => abrirChamadosComFiltro({ status: "Cancelado" })}
              >
                <div className="summary-icon red">
                  <Ban aria-hidden="true" />
                </div>

                <div>
                  <span>Cancelados</span>
                  <strong>{dashboard.chamados_cancelados}</strong>
                  <small>Solicitações canceladas</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver clientes cadastrados"
                onClick={() => setPaginaAtiva("clientes")}
              >
                <div className="summary-icon purple">
                  <UsersRound aria-hidden="true" />
                </div>

                <div>
                  <span>Total de clientes</span>
                  <strong>{dashboard.total_clientes}</strong>
                  <small>Clientes cadastrados</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados de prioridade crítica"
                onClick={() => abrirChamadosComFiltro({ prioridade: "Crítica" })}
              >
                <div className="summary-icon red">
                  <ShieldAlert aria-hidden="true" />
                </div>

                <div>
                  <span>Prioridade crítica</span>
                  <strong>{dashboard.chamados_criticos}</strong>
                  <small>Atendimento imediato</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver usuários cadastrados"
                onClick={() => setPaginaAtiva("usuarios")}
              >
                <div className="summary-icon blue">
                  <UserCog aria-hidden="true" />
                </div>

                <div>
                  <span>Total de usuários</span>
                  <strong>{dashboard.total_usuarios}</strong>
                  <small>Contas cadastradas</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados com SLA vencido"
                onClick={() => abrirChamadosComFiltro({ sla: "Vencido" })}
              >
                <div className="summary-icon red">
                  <TimerOff aria-hidden="true" />
                </div>

                <div>
                  <span>SLA vencido</span>
                  <strong>{dashboard.sla_vencidos}</strong>
                  <small>Chamados fora do prazo</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados próximos do vencimento do SLA"
                onClick={() => abrirChamadosComFiltro({ sla: "Próximo do vencimento" })}
              >
                <div className="summary-icon orange">
                  <Timer aria-hidden="true" />
                </div>

                <div>
                  <span>SLA próximo do vencimento</span>
                  <strong>{dashboard.sla_proximos_vencimento}</strong>
                  <small>Consumo acima de 80%</small>
                </div>
              </button>

              <button
                className="summary-card"
                type="button"
                aria-label="Ver chamados e tempo médio de resolução"
                onClick={abrirChamados}
              >
                <div className="summary-icon green">
                  <Gauge aria-hidden="true" />
                </div>

                <div>
                  <span>Tempo médio de resolução</span>
                  <strong>
                    {formatarTempoMedio(
                      dashboard.tempo_medio_resolucao_minutos,
                    )}
                  </strong>
                  <small>Chamados resolvidos e fechados</small>
                </div>
              </button>

              <div
                className="summary-card"
                aria-label={`Tempo médio de primeira resposta: ${formatarTempoMedio(
                  dashboard.tempo_medio_primeira_resposta_minutos,
                )}`}
              >
                <div className="summary-icon blue">
                  <MessageCircle aria-hidden="true" />
                </div>

                <div>
                  <span>Tempo médio de primeira resposta</span>
                  <strong>
                    {formatarTempoMedio(
                      dashboard.tempo_medio_primeira_resposta_minutos,
                    )}
                  </strong>
                  <small>Primeiro comentário público da equipe</small>
                </div>
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Últimos Chamados</h2>
                  <p>Os cinco registros mais recentes do sistema.</p>
                </div>

                <button
                  className="text-button"
                  type="button"
                  onClick={abrirChamados}
                >
                  Ver todos
                </button>
              </div>

              <div className="ticket-table-wrapper">
                <table className="ticket-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Chamado</th>
                      <th>Responsável</th>
                      <th>Prioridade</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.chamados_recentes.length > 0 ? (
                      dashboard.chamados_recentes.map((chamado) => (
                        <tr key={chamado.id}>
                          <td className="ticket-id">
                            {formatarId(chamado.id)}
                          </td>

                          <td className="ticket-title">{chamado.titulo}</td>

                          <td>{chamado.responsavel_nome || "Não atribuído"}</td>

                          <td>
                            <span
                              className={`priority ${classeChamado(
                                "priority",
                                chamado.prioridade,
                              )}`}
                            >
                              {chamado.prioridade}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status ${classeChamado(
                                "status",
                                chamado.status,
                              )}`}
                            >
                              {chamado.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="empty-table" colSpan="5">
                          Nenhum chamado registrado.
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

      {modalAberto && !somenteLeitura && (
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
          onPublicResponse={recarregarDashboardAtual}
          somenteLeitura={somenteLeitura}
          administrador={administrador}
        />
      )}

      <Toast toast={toast} onClose={fecharToast} />
    </div>
  );
}

export default Dashboard;
