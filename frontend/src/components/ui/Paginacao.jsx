import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Paginacao.css";

function montarItensPaginacao(paginaAtual, totalPaginas) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  }

  const paginas = [
    ...new Set([
      1,
      paginaAtual - 1,
      paginaAtual,
      paginaAtual + 1,
      totalPaginas,
    ]),
  ]
    .filter((pagina) => pagina >= 1 && pagina <= totalPaginas)
    .sort((paginaA, paginaB) => paginaA - paginaB);

  return paginas.flatMap((pagina, indice) => {
    const paginaAnterior = paginas[indice - 1];

    if (paginaAnterior && pagina - paginaAnterior > 1) {
      return [`intervalo-${paginaAnterior}-${pagina}`, pagina];
    }

    return [pagina];
  });
}

function Paginacao({
  paginaAtual,
  totalPaginas,
  onChange,
  ariaLabel = "Paginação",
}) {
  if (totalPaginas <= 1) return null;

  const itens = montarItensPaginacao(paginaAtual, totalPaginas);

  return (
    <nav className="paginacao" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label="Página anterior"
        disabled={paginaAtual === 1}
        onClick={() => onChange(paginaAtual - 1)}
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>

      <div className="paginacao-numeros">
        {itens.map((item) =>
          typeof item === "string" ? (
            <span key={item} className="paginacao-reticencias" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === paginaAtual ? "ativa" : ""}
              aria-label={`Ir para a página ${item}`}
              aria-current={item === paginaAtual ? "page" : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        aria-label="Próxima página"
        disabled={paginaAtual === totalPaginas}
        onClick={() => onChange(paginaAtual + 1)}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  );
}

export default Paginacao;
