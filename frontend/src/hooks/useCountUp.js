import { useEffect, useRef, useState } from "react";

function prefereMovimentoReduzido() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export default function useCountUp(valorFinal, { duracao = 700 } = {}) {
  const alvo = Number.isFinite(valorFinal) ? valorFinal : 0;
  const [valorExibido, setValorExibido] = useState(alvo);
  const valorAnteriorRef = useRef(alvo);

  useEffect(() => {
    const origem = valorAnteriorRef.current;

    if (prefereMovimentoReduzido() || origem === alvo) {
      setValorExibido(alvo);
      valorAnteriorRef.current = alvo;
      return undefined;
    }

    let frame;
    const inicio = performance.now();

    function animar(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - (1 - progresso) ** 3;
      setValorExibido(Math.round(origem + (alvo - origem) * suavizado));

      if (progresso < 1) {
        frame = requestAnimationFrame(animar);
      } else {
        valorAnteriorRef.current = alvo;
      }
    }

    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, [alvo, duracao]);

  return valorExibido;
}
