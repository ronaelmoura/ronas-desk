import { useState } from 'react'
import './TicketDetailsModal.css'

function TicketDetailsModal({
  chamado,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [titulo, setTitulo] = useState(chamado.titulo)
  const [descricao, setDescricao] = useState(chamado.descricao)
  const [categoria, setCategoria] = useState(chamado.categoria)
  const [prioridade, setPrioridade] = useState(chamado.prioridade)
  const [status, setStatus] = useState(chamado.status)

  const [erro, setErro] = useState('')
  const [confirmandoExclusao, setConfirmandoExclusao] =
    useState(false)

  function formatarId(id) {
    return `#${String(id).padStart(3, '0')}`
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !categoria ||
      !prioridade ||
      !status
    ) {
      setErro('Preencha todos os campos.')
      return
    }

    onUpdate({
      ...chamado,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria,
      prioridade,
      status,
    })
  }

  function confirmarExclusao() {
    onDelete(chamado.id)
  }

  return (
    <div
      className="details-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="ticket-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ticket-details-header">
          <div>
            <p className="ticket-details-eyebrow">
              {formatarId(chamado.id)}
            </p>

            <h2 id="ticket-details-title">
              Editar chamado
            </h2>

            <p>
              Atualize as informações do atendimento.
            </p>
          </div>

          <button
            className="details-close-button"
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            ×
          </button>
        </header>

        <form
          className="ticket-details-content"
          onSubmit={handleSubmit}
        >
          <div className="ticket-edit-field">
            <label htmlFor="edit-title">
              Título do chamado
            </label>

            <input
              id="edit-title"
              type="text"
              value={titulo}
              onChange={(event) =>
                setTitulo(event.target.value)
              }
            />
          </div>

          <div className="ticket-edit-grid">
            <div className="ticket-edit-field">
              <label htmlFor="edit-category">
                Categoria
              </label>

              <select
                id="edit-category"
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value)
                }
              >
                <option value="Hardware">
                  Hardware
                </option>

                <option value="Software">
                  Software
                </option>

                <option value="Rede">
                  Rede
                </option>

                <option value="Acesso">
                  Acesso
                </option>

                <option value="Outro">
                  Outro
                </option>
              </select>
            </div>

            <div className="ticket-edit-field">
              <label htmlFor="edit-priority">
                Prioridade
              </label>

              <select
                id="edit-priority"
                value={prioridade}
                onChange={(event) =>
                  setPrioridade(event.target.value)
                }
              >
                <option value="Baixa">
                  Baixa
                </option>

                <option value="Média">
                  Média
                </option>

                <option value="Alta">
                  Alta
                </option>
              </select>
            </div>
          </div>

          <div className="ticket-edit-field">
            <label htmlFor="edit-description">
              Descrição
            </label>

            <textarea
              id="edit-description"
              rows="6"
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
            />
          </div>

          <div className="ticket-edit-field">
            <label htmlFor="edit-status">
              Status
            </label>

            <select
              id="edit-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="Aberto">
                Aberto
              </option>

              <option value="Em andamento">
                Em andamento
              </option>

              <option value="Concluído">
                Concluído
              </option>
            </select>
          </div>

          {erro && (
            <p className="ticket-edit-error">
              {erro}
            </p>
          )}

          {confirmandoExclusao ? (
            <div className="delete-confirmation">
              <div>
                <strong>Excluir este chamado?</strong>

                <p>
                  Essa ação não poderá ser desfeita.
                </p>
              </div>

              <div className="delete-confirmation-actions">
                <button
                  className="delete-cancel-button"
                  type="button"
                  onClick={() =>
                    setConfirmandoExclusao(false)
                  }
                >
                  Não, cancelar
                </button>

                <button
                  className="delete-confirm-button"
                  type="button"
                  onClick={confirmarExclusao}
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
                onClick={() =>
                  setConfirmandoExclusao(true)
                }
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
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

export default TicketDetailsModal