import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function carregarRelacionamentos() {
      try {
        const [resultadoClientes, resultadoUsuarios] = await Promise.all([
          listarClientesApi(),
          listarUsuariosApi(),
        ]);

        const clientesAtivos = resultadoClientes.filter(
          (cliente) => cliente.ativo === true || cliente.ativo === 1,
        );
        const usuariosAtivos = resultadoUsuarios.filter(
          (usuario) => usuario.ativo === true || usuario.ativo === 1,
        );

        setClientes(clientesAtivos);
        setUsuarios(usuariosAtivos);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregandoClientes(false);
        setCarregandoUsuarios(false);
      }
    }

    carregarRelacionamentos();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
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

    onSave({
      cliente_id: Number(clienteId),
      responsavel_id: responsavelId ? Number(responsavelId) : null,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria,
      prioridade,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ticket-modal-header">
          <div>
            <p className="ticket-modal-eyebrow">Nova solicitação</p>

            <h2 id="new-ticket-title">Abrir chamado</h2>

            <p>Selecione o cliente e descreva o problema.</p>
          </div>

          <div className="ticket-field full-width">
            <label htmlFor="responsavel">Responsável</label>

            <select
              id="responsavel"
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

          <button
            className="close-modal-button"
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            ×
          </button>
        </header>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <div className="ticket-field full-width">
            <label htmlFor="cliente">Cliente</label>

            <select
              id="cliente"
              value={clienteId}
              disabled={carregandoClientes}
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
            <label htmlFor="titulo">Título do chamado</label>

            <input
              id="titulo"
              type="text"
              placeholder="Ex.: Computador não conecta à internet"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
            />
          </div>

          <div className="ticket-form-grid">
            <div className="ticket-field">
              <label htmlFor="categoria">Categoria</label>

              <select
                id="categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              >
                <option value="">Selecione</option>

                <option value="Hardware">Hardware</option>

                <option value="Software">Software</option>

                <option value="Rede">Rede</option>

                <option value="Acesso">Acesso</option>

                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="ticket-field">
              <label htmlFor="prioridade">Prioridade</label>

              <select
                id="prioridade"
                value={prioridade}
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
              onChange={(event) => setDescricao(event.target.value)}
            />
          </div>

          {erro && <p className="ticket-form-error">{erro}</p>}

          {!carregandoClientes && clientes.length === 0 && (
            <p className="ticket-form-error">
              Nenhum cliente ativo disponível. Cadastre ou ative um cliente
              antes de abrir o chamado.
            </p>
          )}

          <div className="ticket-modal-actions">
            <button
              className="cancel-ticket-button"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              className="save-ticket-button"
              type="submit"
              disabled={
                carregandoClientes ||
                carregandoUsuarios ||
                clientes.length === 0
              }
            >
              Abrir chamado
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default NewTicketModal;
