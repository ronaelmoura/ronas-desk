import { useEffect, useState } from "react";
import "./Dashboard.css";
import NewTicketModal from "./NewTicketModal";
import TicketDetailsModal from "./TicketDetailsModal";
import AllTickets from "./AllTickets";
import ProfileSettings from "./ProfileSettings";
import Clientes from "../pages/Clientes/clientes";
import Usuarios from "../pages/Usuarios/Usuarios";
import Relatorios from "../pages/Relatorios/Relatorios";
import useAuth from "../hooks/useAuth";
import {
  criarChamadoApi,
  excluirChamadoApi,
  listarChamadosApi,
  atualizarChamadoApi,
} from "../services/chamadosApi";
import { buscarDashboardApi } from "../services/dashboardApi";
import { classeChamado } from "../utils/chamados";

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

const perfilInicial = {
  nome: "Ronael Moura",
  email: "ronael@email.com",
  cargo: "Administrador",
  notificacoes: true,
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
  if (minutos < 60) return `${minutos}min`;

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

function carregarPerfil() {
  try {
    const perfilSalvo = localStorage.getItem("ronas-desk-perfil");

    if (!perfilSalvo) {
      return perfilInicial;
    }

    const perfilConvertido = JSON.parse(perfilSalvo);

    if (
      !perfilConvertido ||
      typeof perfilConvertido !== "object" ||
      Array.isArray(perfilConvertido)
    ) {
      return perfilInicial;
    }

    return {
      nome:
        typeof perfilConvertido.nome === "string" &&
        perfilConvertido.nome.trim()
          ? perfilConvertido.nome
          : perfilInicial.nome,
      email:
        typeof perfilConvertido.email === "string" &&
        perfilConvertido.email.trim()
          ? perfilConvertido.email
          : perfilInicial.email,
      cargo:
        typeof perfilConvertido.cargo === "string" &&
        perfilConvertido.cargo.trim()
          ? perfilConvertido.cargo
          : perfilInicial.cargo,
      notificacoes:
        typeof perfilConvertido.notificacoes === "boolean"
          ? perfilConvertido.notificacoes
          : perfilInicial.notificacoes,
    };
  } catch {
    return perfilInicial;
  }
}

function Dashboard({ onLogout }) {
  const { usuario } = useAuth();
  const [chamados, setChamados] = useState([]);
  const [dashboard, setDashboard] = useState(dashboardInicial);
  const [perfil, setPerfil] = useState(carregarPerfil);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState("");
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [erroDashboard, setErroDashboard] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [paginaAtiva, setPaginaAtiva] = useState("visao-geral");

  useEffect(() => {
    carregarDashboardDaApi();
  }, []);

  useEffect(() => {
    localStorage.setItem("ronas-desk-perfil", JSON.stringify(perfil));
  }, [perfil]);

  async function carregarChamadosDaApi() {
    setCarregando(true);
    setErroApi("");

    try {
      const dados = await listarChamadosApi();
      setChamados(dados);
    } catch (error) {
      setErroApi(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDashboardDaApi() {
    setCarregandoDashboard(true);
    setErroDashboard("");

    try {
      const dados = await buscarDashboardApi();
      setDashboard(dados);
    } catch (error) {
      setErroDashboard(error.message);
    } finally {
      setCarregandoDashboard(false);
    }
  }

  function abrirVisaoGeral() {
    setPaginaAtiva("visao-geral");
    carregarDashboardDaApi();
  }

  function abrirChamados() {
    setPaginaAtiva("chamados");
    carregarChamadosDaApi();
  }

  async function criarChamado(dados) {
    try {
      const novoChamado = await criarChamadoApi(dados);

      setChamados((chamadosAtuais) => [novoChamado, ...chamadosAtuais]);

      setModalAberto(false);
      carregarDashboardDaApi();
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function atualizarChamado(chamadoAtualizado) {
    try {
      const chamadoSalvo = await atualizarChamadoApi(
        chamadoAtualizado.id,
        chamadoAtualizado,
      );

      setChamados((chamadosAtuais) =>
        chamadosAtuais.map((chamado) =>
          chamado.id === chamadoSalvo.id ? chamadoSalvo : chamado,
        ),
      );

      setChamadoSelecionado(null);
      carregarDashboardDaApi();
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function excluirChamado(id) {
    try {
      await excluirChamadoApi(id);

      setChamados((chamadosAtuais) =>
        chamadosAtuais.filter((chamado) => chamado.id !== id),
      );

      setChamadoSelecionado(null);
      carregarDashboardDaApi();
    } catch (error) {
      window.alert(error.message);
    }
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
              paginaAtiva === "visao-geral" ? "active" : ""
            }`}
            type="button"
            onClick={abrirVisaoGeral}
          >
            <span>⌂</span>
            Visão geral
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "clientes" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("clientes")}
          >
            <span>👥</span>
            Clientes
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "chamados" ? "active" : ""
            }`}
            type="button"
            onClick={abrirChamados}
          >
            <span>▤</span>
            Chamados
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "usuarios" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("usuarios")}
          >
            <span>♟</span>
            Usuários
          </button>

          <button
            className={`menu-item ${
              paginaAtiva === "relatorios" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("relatorios")}
          >
            <span>▥</span>
            Relatórios
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
              paginaAtiva === "configuracoes" ? "active" : ""
            }`}
            type="button"
            onClick={() => setPaginaAtiva("configuracoes")}
          >
            <span>⚙</span>
            Configurações
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{obterIniciais(perfil.nome)}</div>

            <div>
              <strong>{perfil.nome}</strong>
              <span>{perfil.cargo}</span>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        {paginaAtiva === "clientes" ? (
          <Clientes onSelectTicket={setChamadoSelecionado} />
        ) : paginaAtiva === "usuarios" ? (
          <Usuarios administrador={usuario?.cargo === "Administrador"} />
        ) : paginaAtiva === "relatorios" ? (
          <Relatorios />
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
              chamados={chamados}
              onSelectTicket={setChamadoSelecionado}
              onNewTicket={() => setModalAberto(true)}
            />
          )
        ) : paginaAtiva === "configuracoes" ? (
          <ProfileSettings perfil={perfil} onSave={setPerfil} />
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
              onClick={carregarDashboardDaApi}
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <>
            <header className="dashboard-header">
              <div>
                <p className="dashboard-eyebrow">Painel de controle</p>

                <h1>Olá, {obterPrimeiroNome(perfil.nome)} 👋</h1>

                <p>
                  Acompanhe os chamados e as atividades recentes do suporte.
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
              <button
                className="summary-card"
                type="button"
                aria-label="Ver todos os chamados"
                onClick={abrirChamados}
              >
                <div className="summary-icon blue">▤</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon red">!</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon orange">◷</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon green">✓</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon green">✓</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon purple">■</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon red">×</div>

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
                <div className="summary-icon purple">♟</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon red">↑</div>

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
                <div className="summary-icon blue">♟</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon red">!</div>

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
                onClick={abrirChamados}
              >
                <div className="summary-icon orange">◷</div>

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
                <div className="summary-icon green">◴</div>

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
                aria-label="Tempo médio de primeira resposta ainda não disponível"
              >
                <div className="summary-icon blue">◷</div>

                <div>
                  <span>Tempo médio de primeira resposta</span>
                  <strong>
                    {formatarTempoMedio(
                      dashboard.tempo_medio_primeira_resposta_minutos,
                    )}
                  </strong>
                  <small>Aguardando registro da primeira resposta</small>
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
  );
}

export default Dashboard;
