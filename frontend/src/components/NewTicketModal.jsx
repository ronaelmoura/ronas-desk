import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { listarClientesApi } from "../services/clientesApi";
import { listarUsuariosApi } from "../services/usuariosApi";
import { PRIORIDADES_CHAMADOS } from "../utils/chamados";
import "./NewTicketModal.css";

function NewTicketModal({ onClose, onSave }) {
  const [clienteId, setClienteId] = useState("");
  const [clientes, setClientes] = useState([]);
  const [responsavelId, setResponsavelId] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [erro, setErro] = useState("");
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const modalRef = useRef(null);
  const botaoFecharRef = useRef(null);
  const salvandoRef = useRef(false);

  useEffect(() => {
    salvandoRef.current = salvando;
  }, [salvando]);

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    botaoFecharRef.current?.focus();

    function controlarTeclado(event) {
      if (event.key === "Escape" && !salvandoRef.current) {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elementos = [
        ...(modalRef.current?.querySelectorAll(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
        ) ?? []),
      ];
      const primeiro = elementos[0];
      const ultimo = elementos.at(-1);

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo?.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro?.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);

    return () => {
      document.removeEventListener("keydown", controlarTeclado);
      elementoAnterior?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    async function carregarRelacionamentos() {
      try {
        const [resultadoClientes, resultadoUsuarios] = await Promise.all([
          listarClientesApi(),
          listarUsuariosApi(),
        ]);

        setClientes(
          resultadoClientes.filter(
            (cliente) => cliente.ativo === true || cliente.ativo === 1,
          ),
        );
        setUsuarios(
          resultadoUsuarios.filter(
            (usuario) => usuario.ativo === true || usuario.ativo === 1,
          ),
        );
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregandoClientes(false);
        setCarregandoUsuarios(false);
      }
    }

    carregarRelacionamentos();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (salvando) return;

    setErro("");

    if (
      !clienteId ||
      !titulo.trim() ||
      !descricao.trim() ||
      !categoria ||
      !prioridade
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    setSalvando(true);

    try {
      await onSave({
        cliente_id: Number(clienteId),
        responsavel_id: responsavelId ? Number(responsavelId) : null,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        prioridade,
      });
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  function fecharPeloFundo(event) {
    if (event.target === event.currentTarget && !salvando) onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={fecharPeloFundo}>
      <section
        className="ticket-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        aria-busy={salvando}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ticket-modal-header">
          <div>
            <p className="ticket-modal-eyebrow">Nova solicitação</p>
            <h2 id="new-ticket-title">Abrir chamado</h2>
            <p>Selecione o cliente e descreva o problema.</p>
          </div>

          <button
            className="close-modal-button"
            ref={botaoFecharRef}
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar formulário"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <div className="ticket-field full-width">
            <label htmlFor="cliente">Cliente</label>
            <select
              id="cliente"
              value={clienteId}
              disabled={carregandoClientes || salvando}
              onChange={(event) => setClienteId(event.target.value)}
            >
              <option value="">
                {carregandoClientes
                  ? "Carregando clientes..."
                  : "Selecione um cliente"}
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                  {cliente.empresa ? ` — ${cliente.empresa}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="ticket-field full-width">
            <label htmlFor="responsavel">Responsável</label>
            <select
              id="responsavel"
              value={responsavelId}
              disabled={carregandoUsuarios || salvando}
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

          <div className="ticket-field full-width">
            <label htmlFor="titulo">Título do chamado</label>
            <input
              id="titulo"
              type="text"
              placeholder="Ex.: Computador não conecta à internet"
              value={titulo}
              disabled={salvando}
              onChange={(event) => setTitulo(event.target.value)}
            />
          </div>

          <div className="ticket-form-grid">
            <div className="ticket-field">
              <label htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                value={categoria}
                disabled={salvando}
                onChange={(event) => setCategoria(event.target.value)}
              >
                <option value="">Selecione</option>
                {[
                  "Hardware",
                  "Software",
                  "Rede",
                  "Acesso",
                  "Outro",
                ].map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            <div className="ticket-field">
              <label htmlFor="prioridade">Prioridade</label>
              <select
                id="prioridade"
                value={prioridade}
                disabled={salvando}
                onChange={(event) => setPrioridade(event.target.value)}
              >
                <option value="">Selecione</option>
                {PRIORIDADES_CHAMADOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ticket-field full-width">
            <label htmlFor="descricao">Descrição do problema</label>
            <textarea
              id="descricao"
              rows="6"
              placeholder="Explique quando o problema começou e o que já foi tentado."
              value={descricao}
              disabled={salvando}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </div>

          {erro && (
            <p className="ticket-form-error" role="alert">
              {erro}
            </p>
          )}

          {!carregandoClientes && clientes.length === 0 && (
            <p className="ticket-form-error" role="alert">
              Nenhum cliente ativo disponível. Cadastre ou ative um cliente
              antes de abrir o chamado.
            </p>
          )}

          <div className="ticket-modal-actions">
            <button
              className="cancel-ticket-button"
              type="button"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              className="save-ticket-button"
              type="submit"
              disabled={
                carregandoClientes ||
                carregandoUsuarios ||
                salvando ||
                clientes.length === 0
              }
            >
              {salvando ? "Abrindo..." : "Abrir chamado"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default NewTicketModal;
