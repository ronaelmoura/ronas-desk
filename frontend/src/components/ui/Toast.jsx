import { useEffect } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const temporizador = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(temporizador);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icone = toast.tipo === "sucesso" ? CheckCircle2 : CircleAlert;

  return (
    <div className={`toast ${toast.tipo}`} role="status" aria-live="polite">
      <Icone size={20} aria-hidden="true" />
      <span>{toast.mensagem}</span>
      <button type="button" aria-label="Fechar notificação" onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

export default Toast;
