import { useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import useFocusTrap from "../../hooks/useFocusTrap";
import "./ModalConfirmacao.css";

function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  confirmando,
  onCancel,
  onConfirm,
  rotuloConfirmar = "Confirmar",
  confirmandoTexto = "Processando...",
}) {
  const botaoCancelarRef = useRef(null);

  const modalRef = useFocusTrap({
    ativo: aberto,
    focoInicialRef: botaoCancelarRef,
    bloquearEscape: confirmando,
    onEscape: () => onCancel?.(),
  });

  if (!aberto) return null;

  function cancelar() {
    if (!confirmando) onCancel?.();
  }

  return (
    <div
      className="confirmacao-overlay"
      role="presentation"
      onMouseDown={cancelar}
    >
      <section
        ref={modalRef}
        className="confirmacao-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-mensagem"
        aria-busy={confirmando}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirmacao-icone" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <button
          className="confirmacao-fechar"
          type="button"
          aria-label="Fechar"
          disabled={confirmando}
          onClick={cancelar}
        >
          <X size={19} aria-hidden="true" />
        </button>
        <h2 id="confirmacao-titulo">{titulo}</h2>
        <p id="confirmacao-mensagem">{mensagem}</p>
        <div className="confirmacao-acoes">
          <button
            ref={botaoCancelarRef}
            type="button"
            className="confirmacao-cancelar"
            disabled={confirmando}
            onClick={cancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirmacao-confirmar"
            disabled={confirmando}
            onClick={onConfirm}
          >
            {confirmando ? confirmandoTexto : rotuloConfirmar}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ModalConfirmacao;
