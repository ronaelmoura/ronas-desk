import { useEffect, useState } from "react";
import {
  History,
  Info,
  MessageSquare,
  X,
} from "lucide-react";
import {
  criarComentarioChamadoApi,
  listarComentariosChamadoApi,
} from "../services/chamadosApi";
import { listarUsuariosApi } from "../services/usuariosApi";
import { PRIORIDADES_CHAMADOS, STATUS_CHAMADOS } from "../utils/chamados";
import SlaCard from "./sla/SlaCard";
import TicketTimeline from "./TicketTimeline";
import "./TicketDetailsModal.css";

function formatarDataHora(data) {
  const valor = new Date(data);
  return {
    data: valor.toLocaleDateString("pt-BR"),
    hora: valor.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function TicketDetailsModal({ chamado, onClose, onUpdate, onDelete }) {
  const [abaAtiva, setAbaAtiva] = useState("informacoes");
  const [titulo, setTitulo] = useState(chamado.titulo);
  const [descricao, setDescricao] = useState(chamado.descricao);
  const [categoria, setCategoria] = useState(chamado.categoria);
  const [prioridade, setPrioridade] = useState(chamado.prioridade);
  const [status, setStatus] = useState(chamado.status);
  const [responsavelId, setResponsavelId] = useState(
    chamado.responsavel_id ? String(chamado.responsavel_id) : "",
  );
  const [usuarios, setUsuarios] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoComentario, setTipoComentario] = useState("INTERNO");
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(true);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resultadoUsuarios, resultadoComentarios] = await Promise.all([
          listarUsuariosApi(),
          listarComentariosChamadoApi(chamado.id),
        ]);

        setUsuarios(resultadoUsuarios.filter((usuario) => usuario.ativo));
        setComentarios(resultadoComentarios);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregandoUsuarios(false);
        setCarregandoInteracoes(false);
      }
    }

    carregarDados();
  }, [chamado.id]);

  function formatarId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !categoria ||
      !prioridade ||
      !status
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    onUpdate({
      ...chamado,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria,
      prioridade,
      status,
      responsavel_id: responsavelId ? Number(responsavelId) : null,
    });
  }

  async function adicionarComentario(event) {
    event.preventDefault();
    const conteudo = novoComentario.trim();
    if (!conteudo) return;

    setEnviandoComentario(true);
    setErro("");

    try {
      const comentario = await criarComentarioChamadoApi(
        chamado.id,
        conteudo,
        tipoComentario,
      );
      setComentarios((atuais) => [...atuais, comentario]);
      setNovoComentario("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviandoComentario(false);
    }
  }

  return (
    <div className="details-backdrop" onMouseDown={onClose}>
      <section
        className="ticket-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ticket-details-header">
          <div>
            <p className="ticket-details-eyebrow">{formatarId(chamado.id)}</p>
            <h2 id="ticket-details-title">{chamado.titulo}</h2>
            <p>
              Acompanhe informações, comentários e histórico do atendimento.
            </p>
          </div>

          <button
            className="details-close-button"
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <nav className="ticket-details-tabs" aria-label="Seções do chamado">
          <button
            type="button"
            className={abaAtiva === "informacoes" ? "active" : ""}
            aria-current={abaAtiva === "informacoes" ? "page" : undefined}
            onClick={() => setAbaAtiva("informacoes")}
          >
            <Info size={17} aria-hidden="true" />
            Informações
          </button>
          <button
            type="button"
            className={abaAtiva === "comentarios" ? "active" : ""}
            aria-current={abaAtiva === "comentarios" ? "page" : undefined}
            onClick={() => setAbaAtiva("comentarios")}
          >
            <MessageSquare size={17} aria-hidden="true" />
            Comentários
            <span>{comentarios.length}</span>
          </button>
          <button
            type="button"
            className={abaAtiva === "timeline" ? "active" : ""}
            aria-current={abaAtiva === "timeline" ? "page" : undefined}
            onClick={() => setAbaAtiva("timeline")}
          >
            <History size={17} aria-hidden="true" />
            Histórico
          </button>
        </nav>

        {erro && (
          <p
            className="ticket-edit-error ticket-details-global-error"
            role="alert"
          >
            {erro}
          </p>
        )}

        {abaAtiva === "informacoes" && (
          <form className="ticket-details-content" onSubmit={handleSubmit}>
            <SlaCard sla={chamado.sla} />

            <div className="ticket-edit-field">
              <label htmlFor="edit-title">Título do chamado</label>
              <input
                id="edit-title"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
              />
            </div>

            <div className="ticket-edit-grid">
              <div className="ticket-edit-field">
                <label htmlFor="edit-category">Categoria</label>
                <select
                  id="edit-category"
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                >
                  {["Hardware", "Software", "Rede", "Acesso", "Outro"].map(
                    (opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="ticket-edit-field">
                <label htmlFor="edit-priority">Prioridade</label>
                <select
                  id="edit-priority"
                  value={prioridade}
                  onChange={(event) => setPrioridade(event.target.value)}
                >
                  {PRIORIDADES_CHAMADOS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ticket-edit-field">
              <label htmlFor="edit-responsavel">Responsável</label>
              <select
                id="edit-responsavel"
                value={responsavelId}
                disabled={carregandoUsuarios}
                onChange={(event) => setResponsavelId(event.target.value)}
              >
                <option value="">
                  {carregandoUsuarios
                    ? "Carregando responsáveis..."
                    : "Não atribuído"}
                </option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} — {usuario.cargo}
                  </option>
                ))}
              </select>
            </div>

            <div className="ticket-edit-field">
              <label htmlFor="edit-description">Descrição</label>
              <textarea
                id="edit-description"
                rows="6"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
              />
            </div>

            <div className="ticket-edit-field">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUS_CHAMADOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            {confirmandoExclusao ? (
              <div className="delete-confirmation">
                <div>
                  <strong>Excluir este chamado?</strong>
                  <p>Essa ação não poderá ser desfeita.</p>
                </div>
                <div className="delete-confirmation-actions">
                  <button
                    className="delete-cancel-button"
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                  >
                    Não, cancelar
                  </button>
                  <button
                    className="delete-confirm-button"
                    type="button"
                    onClick={() => onDelete(chamado.id)}
                  >
                    Sim, excluir
                  </button>
                </div>
              </div>
            ) : (
              <div className="ticket-details-actions">
                <button
                  className="details-delete-button"
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                >
                  Excluir
                </button>
                <div className="details-main-actions">
                  <button
                    className="details-cancel-button"
                    type="button"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    className="details-save-button"
                    type="submit"
                    disabled={carregandoUsuarios}
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {abaAtiva === "comentarios" && (
          <section className="ticket-interactions-content">
            <form className="comment-form" onSubmit={adicionarComentario}>
              <div className="comment-form-header">
                <label htmlFor="new-comment">Adicionar comentário</label>
                <label className="comment-type-field">
                  <span>Visibilidade</span>
                  <select
                    value={tipoComentario}
                    aria-label="Visibilidade do comentário"
                    onChange={(event) => setTipoComentario(event.target.value)}
                  >
                    <option value="INTERNO">Interno</option>
                    <option value="PUBLICO">Público</option>
                  </select>
                </label>
              </div>
              <textarea
                id="new-comment"
                rows="4"
                maxLength="2000"
                value={novoComentario}
                placeholder="Registre uma atualização para a equipe..."
                onChange={(event) => setNovoComentario(event.target.value)}
              />
              <div>
                <small>{novoComentario.length}/2000</small>
                <button
                  className="details-save-button"
                  type="submit"
                  disabled={enviandoComentario || !novoComentario.trim()}
                >
                  {enviandoComentario ? "Publicando..." : "Publicar comentário"}
                </button>
              </div>
            </form>

            {carregandoInteracoes ? (
              <div className="interaction-loading">
                Carregando comentários...
              </div>
            ) : comentarios.length ? (
              <div className="comments-list">
                {comentarios.map((comentario) => {
                  const dataHora = formatarDataHora(comentario.created_at);
                  return (
                    <article className="comment-card" key={comentario.id}>
                      <div className="comment-avatar" aria-hidden="true">
                        {(comentario.usuario_nome || "Sistema")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <header>
                          <strong>
                            {comentario.usuario_nome || "Usuário removido"}
                          </strong>
                          <span
                            className={`comment-type-badge ${comentario.tipo.toLowerCase()}`}
                          >
                            {comentario.tipo === "PUBLICO"
                              ? "Público"
                              : "Interno"}
                          </span>
                          <span>
                            {dataHora.data} às {dataHora.hora}
                          </span>
                        </header>
                        <p>{comentario.conteudo}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="interaction-empty">
                <MessageSquare size={30} aria-hidden="true" />
                <strong>Nenhum comentário ainda</strong>
                <p>Seja o primeiro a registrar uma atualização.</p>
              </div>
            )}
          </section>
        )}

        {abaAtiva === "timeline" && (
          <section className="ticket-interactions-content">
            <TicketTimeline ticketId={chamado.id} />
          </section>
        )}
      </section>
    </div>
  );
}

export default TicketDetailsModal;
