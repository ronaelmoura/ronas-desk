import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  confirmando,
  onCancel,
  onConfirm,
}) {
  const botaoCancelarRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;

    botaoCancelarRef.current?.focus();
    function fecharComEscape(event) {
      if (event.key === "Escape" && !confirmando) onCancel();
    }

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [aberto, confirmando, onCancel]);

  if (!aberto) return null;

  return (
    <div
      className="usuario-modal-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="confirmacao-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-mensagem"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirmacao-icone" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <button
          className="modal-fechar"
          type="button"
          aria-label="Fechar"
          onClick={onCancel}
        >
          <X size={19} aria-hidden="true" />
        </button>
        <h2 id="confirmacao-titulo">{titulo}</h2>
        <p id="confirmacao-mensagem">{mensagem}</p>
        <div className="usuario-modal-actions">
          <button
            ref={botaoCancelarRef}
            type="button"
            className="botao-secundario"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="botao-perigo"
            disabled={confirmando}
            onClick={onConfirm}
          >
            {confirmando ? "Excluindo..." : "Excluir usuário"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ModalConfirmacao;
