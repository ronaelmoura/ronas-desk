import { useEffect, useState } from "react";
import "./Dashboard.css";
import NewTicketModal from "./NewTicketModal";
import TicketDetailsModal from "./TicketDetailsModal";
import AllTickets from "./AllTickets";
import ProfileSettings from "./ProfileSettings";
import Clientes from "../pages/Clientes/clientes";
import Usuarios from "../pages/Usuarios/Usuarios";
import useAuth from "../hooks/useAuth";
import {
  criarChamadoApi,
  excluirChamadoApi,
  listarChamadosApi,
  atualizarChamadoApi,
} from "../services/chamadosApi";
import { buscarDashboardApi } from "../services/dashboardApi";

const dashboardInicial = {
  total_clientes: 0,
  total_usuarios: 0,
  total_chamados: 0,
  chamados_abertos: 0,
  chamados_em_andamento: 0,
  chamados_concluidos: 0,
  chamados_alta_prioridade: 0,
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
          <section className="dashboard-panel">
            <h2>Carregando dashboard...</h2>
            <p>Aguarde enquanto o Ronas Desk consolida os dados.</p>
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
              <article className="summary-card">
                <div className="summary-icon blue">▤</div>

                <div>
                  <span>Total de chamados</span>
                  <strong>{dashboard.total_chamados}</strong>
                  <small>Todos os registros</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon red">!</div>

                <div>
                  <span>Chamados abertos</span>
                  <strong>{dashboard.chamados_abertos}</strong>
                  <small>Aguardando atendimento</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon orange">◷</div>

                <div>
                  <span>Em andamento</span>
                  <strong>{dashboard.chamados_em_andamento}</strong>
                  <small>Sendo analisados</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon green">✓</div>

                <div>
                  <span>Concluídos</span>
                  <strong>{dashboard.chamados_concluidos}</strong>
                  <small>Problemas resolvidos</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon purple">♟</div>

                <div>
                  <span>Total de clientes</span>
                  <strong>{dashboard.total_clientes}</strong>
                  <small>Clientes cadastrados</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon red">↑</div>

                <div>
                  <span>Alta prioridade</span>
                  <strong>{dashboard.chamados_alta_prioridade}</strong>
                  <small>Atendimentos prioritários</small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon blue">♟</div>

                <div>
                  <span>Total de usuários</span>
                  <strong>{dashboard.total_usuarios}</strong>
                  <small>Contas cadastradas</small>
                </div>
              </article>
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
                                .replace(" ", "-")}`}
                            >
                              {chamado.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="empty-table" colSpan="4">
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
