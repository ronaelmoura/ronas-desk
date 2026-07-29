import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  FolderOpen,
} from "lucide-react";
import { buscarRelatorioChamadosApi } from "../../services/relatoriosApi";
import "./relatorios.css";

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function criarPeriodoInicial() {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 29);

  return {
    dataInicio: formatarDataInput(inicio),
    dataFim: formatarDataInput(fim),
  };
}

const relatorioInicial = {
  periodo: null,
  resumo: {
    total_chamados: 0,
    chamados_abertos: 0,
    chamados_encerrados: 0,
    chamados_cancelados: 0,
    sla_cumprido_percentual: null,
    tempo_medio_resolucao_minutos: null,
  },
  distribuicoes: {
    status: [],
    prioridade: [],
    categoria: [],
    responsavel: [],
  },
  chamados: [],
};

function formatarTempo(minutos) {
  if (!Number.isFinite(minutos)) return "Sem dados";
  if (minutos < 60) return `${Math.round(minutos)}min`;

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = Math.round(minutos % 60);
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

function formatarDataHora(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");
  const seguro = /^[=+\-@]/.test(texto.trimStart()) ? `'${texto}` : texto;
  return `"${seguro.replaceAll('"', '""')}"`;
}

function Distribuicao({ titulo, itens }) {
  const maiorTotal = Math.max(...itens.map((item) => item.total), 0);

  return (
    <article className="report-chart-card">
      <h2>{titulo}</h2>
      {itens.length ? (
        <ul className="report-bars">
          {itens.map((item) => {
            const percentual = maiorTotal
              ? Math.max(4, (item.total / maiorTotal) * 100)
              : 0;

            return (
              <li key={item.rotulo}>
                <div>
                  <span>{item.rotulo}</span>
                  <strong>{item.total}</strong>
                </div>
                <span
                  className="report-bar-track"
                  role="progressbar"
                  aria-label={`${item.rotulo}: ${item.total} chamados`}
                  aria-valuemin="0"
                  aria-valuemax={maiorTotal}
                  aria-valuenow={item.total}
                >
                  <span style={{ width: `${percentual}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="report-card-empty">Nenhum dado no período.</p>
      )}
    </article>
  );
}

function Relatorios() {
  const [filtros, setFiltros] = useState(criarPeriodoInicial);
  const [relatorio, setRelatorio] = useState(relatorioInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarRelatorio(periodo = filtros) {
    setCarregando(true);
    setErro("");

    try {
      const dados = await buscarRelatorioChamadosApi(
        periodo.dataInicio,
        periodo.dataFim,
      );
      setRelatorio(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const periodoInicial = criarPeriodoInicial();
    carregarRelatorio(periodoInicial);
  }, []);

  function aplicarFiltros(event) {
    event.preventDefault();
    carregarRelatorio();
  }

  function exportarCsv() {
    const cabecalho = [
      "ID",
      "Título",
      "Cliente",
      "Responsável",
      "Categoria",
      "Prioridade",
      "Status",
      "SLA",
      "Criado em",
      "Resolvido em",
    ];
    const linhas = relatorio.chamados.map((chamado) => [
      chamado.id,
      chamado.titulo,
      chamado.cliente_nome || "Cliente removido",
      chamado.responsavel_nome || "Não atribuído",
      chamado.categoria,
      chamado.prioridade,
      chamado.status,
      chamado.sla_status || "Sem dados",
      formatarDataHora(chamado.created_at),
      formatarDataHora(chamado.resolved_at),
    ]);
    const conteudo = [cabecalho, ...linhas]
      .map((linha) => linha.map(escaparCsv).join(";"))
      .join("\r\n");
    const arquivo = new Blob([`\uFEFF${conteudo}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `relatorio-chamados-${filtros.dataInicio}-${filtros.dataFim}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const resumo = relatorio.resumo;
  const chamadosVisiveis = relatorio.chamados.slice(0, 100);

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <p className="dashboard-eyebrow">Análise operacional</p>
          <h1>Relatórios</h1>
          <p>
            Analise os chamados criados no período e exporte os resultados.
          </p>
        </div>

        <button
          className="reports-export-button"
          type="button"
          disabled={carregando || !relatorio.chamados.length}
          onClick={exportarCsv}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </button>
      </header>

      <form className="reports-filters" onSubmit={aplicarFiltros}>
        <div>
          <label htmlFor="report-start-date">Data inicial</label>
          <input
            id="report-start-date"
            type="date"
            value={filtros.dataInicio}
            max={filtros.dataFim}
            required
            onChange={(event) =>
              setFiltros((atuais) => ({
                ...atuais,
                dataInicio: event.target.value,
              }))
            }
          />
        </div>
        <div>
          <label htmlFor="report-end-date">Data final</label>
          <input
            id="report-end-date"
            type="date"
            value={filtros.dataFim}
            min={filtros.dataInicio}
            required
            onChange={(event) =>
              setFiltros((atuais) => ({
                ...atuais,
                dataFim: event.target.value,
              }))
            }
          />
        </div>
        <button type="submit" disabled={carregando}>
          <CalendarDays size={18} aria-hidden="true" />
          {carregando ? "Gerando..." : "Aplicar período"}
        </button>
      </form>

      {erro ? (
        <section className="reports-feedback" role="alert">
          <FileBarChart size={32} aria-hidden="true" />
          <strong>Não foi possível gerar o relatório</strong>
          <p>{erro}</p>
          <button type="button" onClick={() => carregarRelatorio()}>
            Tentar novamente
          </button>
        </section>
      ) : carregando ? (
        <section className="reports-feedback" aria-live="polite">
          <BarChart3 size={32} aria-hidden="true" />
          <strong>Gerando relatório...</strong>
          <p>Aguarde enquanto os indicadores são calculados.</p>
        </section>
      ) : (
        <>
          <section className="reports-summary">
            <article>
              <FileBarChart aria-hidden="true" />
              <span>Total no período</span>
              <strong>{resumo.total_chamados}</strong>
              <small>Chamados criados</small>
            </article>
            <article>
              <FolderOpen aria-hidden="true" />
              <span>Em aberto</span>
              <strong>{resumo.chamados_abertos}</strong>
              <small>Aguardando conclusão</small>
            </article>
            <article>
              <CheckCircle2 aria-hidden="true" />
              <span>Encerrados</span>
              <strong>{resumo.chamados_encerrados}</strong>
              <small>Resolvidos ou fechados</small>
            </article>
            <article>
              <BarChart3 aria-hidden="true" />
              <span>SLA cumprido</span>
              <strong>
                {Number.isFinite(resumo.sla_cumprido_percentual)
                  ? `${resumo.sla_cumprido_percentual}%`
                  : "Sem dados"}
              </strong>
              <small>Entre os encerrados</small>
            </article>
            <article>
              <Clock3 aria-hidden="true" />
              <span>Tempo médio</span>
              <strong>
                {formatarTempo(resumo.tempo_medio_resolucao_minutos)}
              </strong>
              <small>Até a resolução</small>
            </article>
          </section>

          <section className="reports-charts">
            <Distribuicao
              titulo="Chamados por status"
              itens={relatorio.distribuicoes.status}
            />
            <Distribuicao
              titulo="Chamados por prioridade"
              itens={relatorio.distribuicoes.prioridade}
            />
            <Distribuicao
              titulo="Chamados por categoria"
              itens={relatorio.distribuicoes.categoria}
            />
            <Distribuicao
              titulo="Chamados por responsável"
              itens={relatorio.distribuicoes.responsavel}
            />
          </section>

          <section className="reports-table-card">
            <div className="reports-table-header">
              <div>
                <h2>Detalhamento dos chamados</h2>
                <p>
                  {relatorio.chamados.length} registro
                  {relatorio.chamados.length === 1 ? "" : "s"} no período.
                </p>
              </div>
              {relatorio.chamados.length > 100 && (
                <span>Exibindo os 100 mais recentes</span>
              )}
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Chamado</th>
                    <th>Responsável</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {chamadosVisiveis.length ? (
                    chamadosVisiveis.map((chamado) => (
                      <tr key={chamado.id}>
                        <td>#{String(chamado.id).padStart(3, "0")}</td>
                        <td>
                          <strong>{chamado.titulo}</strong>
                          <span>{chamado.categoria}</span>
                        </td>
                        <td>{chamado.responsavel_nome || "Não atribuído"}</td>
                        <td>{chamado.prioridade}</td>
                        <td>{chamado.status}</td>
                        <td>{chamado.sla_status || "Sem dados"}</td>
                        <td>{formatarDataHora(chamado.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">Nenhum chamado criado neste período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default Relatorios;
