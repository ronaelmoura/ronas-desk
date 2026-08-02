import { useEffect } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import "./Toast.css";

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const temporizador = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(temporizador);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icone = toast.tipo === "sucesso" ? CheckCircle2 : CircleAlert;
  const papel = toast.tipo === "erro" ? "alert" : "status";
  const prioridade = toast.tipo === "erro" ? "assertive" : "polite";

  return (
    <div className={`toast ${toast.tipo}`} role={papel} aria-live={prioridade}>
      <Icone size={20} aria-hidden="true" />
      <span>{toast.mensagem}</span>
      <button type="button" aria-label="Fechar notificação" onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

export default Toast;
