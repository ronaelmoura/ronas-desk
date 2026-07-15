import { useState } from 'react'
import './TicketDetailsModal.css'

function TicketDetailsModal({
  chamado,
  onClose,
  onUpdateStatus,
}) {
  const [status, setStatus] = useState(chamado.status)

  function handleSubmit(event) {
    event.preventDefault()

    onUpdateStatus(chamado.id, status)
    onClose()
  }

  function formatarId(id) {
    return `#${String(id).padStart(3, '0')}`
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
              Detalhes do chamado
            </h2>

            <p>
              Consulte as informações e atualize o atendimento.
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
          <div className="ticket-main-info">
            <span>Título</span>
            <h3>{chamado.titulo}</h3>
          </div>

          <div className="ticket-information-grid">
            <div className="ticket-information">
              <span>Categoria</span>
              <strong>{chamado.categoria}</strong>
            </div>

            <div className="ticket-information">
              <span>Prioridade</span>

              <strong
                className={`details-priority details-priority-${chamado.prioridade.toLowerCase()}`}
              >
                {chamado.prioridade}
              </strong>
            </div>
          </div>

          <div className="ticket-description">
            <span>Descrição do problema</span>

            <p>{chamado.descricao}</p>
          </div>

          <div className="ticket-status-field">
            <label htmlFor="ticket-status">
              Status do chamado
            </label>

            <select
              id="ticket-status"
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

          <div className="ticket-details-actions">
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
              Salvar alteração
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default TicketDetailsModal