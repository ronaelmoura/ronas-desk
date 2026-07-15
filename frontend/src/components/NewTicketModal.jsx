import { useState } from 'react'
import './NewTicketModal.css'

function NewTicketModal({ onClose, onSave }) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [erro, setErro] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !categoria ||
      !prioridade
    ) {
      setErro('Preencha todos os campos.')
      return
    }

    onSave({
      titulo,
      descricao,
      categoria,
      prioridade,
    })
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
            <p className="ticket-modal-eyebrow">
              Nova solicitação
            </p>

            <h2 id="new-ticket-title">
              Abrir chamado
            </h2>

            <p>
              Descreva o problema para iniciar o atendimento.
            </p>
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

        <form
          className="ticket-form"
          onSubmit={handleSubmit}
        >
          <div className="ticket-field full-width">
            <label htmlFor="titulo">
              Título do chamado
            </label>

            <input
              id="titulo"
              type="text"
              placeholder="Ex.: Computador não conecta à internet"
              value={titulo}
              onChange={(event) =>
                setTitulo(event.target.value)
              }
            />
          </div>

          <div className="ticket-form-grid">
            <div className="ticket-field">
              <label htmlFor="categoria">
                Categoria
              </label>

              <select
                id="categoria"
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value)
                }
              >
                <option value="">
                  Selecione
                </option>

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

            <div className="ticket-field">
              <label htmlFor="prioridade">
                Prioridade
              </label>

              <select
                id="prioridade"
                value={prioridade}
                onChange={(event) =>
                  setPrioridade(event.target.value)
                }
              >
                <option value="">
                  Selecione
                </option>

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

          <div className="ticket-field full-width">
            <label htmlFor="descricao">
              Descrição do problema
            </label>

            <textarea
              id="descricao"
              rows="6"
              placeholder="Explique quando o problema começou e o que já foi tentado."
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
            />
          </div>

          {erro && (
            <p className="ticket-form-error">
              {erro}
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
            >
              Abrir chamado
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default NewTicketModal