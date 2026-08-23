import { useEffect, useRef } from "react";

const SELETOR_FOCAVEIS =
  "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]";

export default function useFocusTrap({
  ativo = true,
  focoInicialRef,
  bloquearEscape = false,
  onEscape,
} = {}) {
  const modalRef = useRef(null);
  const bloquearEscapeRef = useRef(bloquearEscape);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    bloquearEscapeRef.current = bloquearEscape;
  }, [bloquearEscape]);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!ativo) return undefined;

    const elementoAnterior = document.activeElement;
    const quadroAnimacao = window.requestAnimationFrame(() => {
      const alvo =
        focoInicialRef?.current ??
        modalRef.current?.querySelector(SELETOR_FOCAVEIS);
      alvo?.focus();
    });

    function controlarTeclado(event) {
      if (event.key === "Escape") {
        if (bloquearEscapeRef.current) return;
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const elementos = [
        ...(modalRef.current?.querySelectorAll(SELETOR_FOCAVEIS) ?? []),
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
      elementoAnterior?.focus?.();
    };
  }, [ativo, focoInicialRef]);

  return modalRef;
}
