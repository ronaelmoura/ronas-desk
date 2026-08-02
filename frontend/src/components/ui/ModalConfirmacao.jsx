import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
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
  const modalRef = useRef(null);
  const botaoCancelarRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const confirmandoRef = useRef(confirmando);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    confirmandoRef.current = confirmando;
  }, [confirmando]);

  useEffect(() => {
    if (!aberto) return undefined;

    const focoAnterior = document.activeElement;
    const quadroAnimacao = window.requestAnimationFrame(() => {
      botaoCancelarRef.current?.focus();
    });

    function controlarTeclado(event) {
      if (event.key === "Escape" && !confirmandoRef.current) {
        onCancelRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const elementos = [
        ...(modalRef.current?.querySelectorAll("button:not(:disabled)") ?? []),
      ];
      if (!elementos.length) return;

      const primeiro = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);
    return () => {
      window.cancelAnimationFrame(quadroAnimacao);
      document.removeEventListener("keydown", controlarTeclado);
      focoAnterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;

  function cancelar() {
    if (!confirmando) onCancelRef.current?.();
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
