import { ChevronLeft, ChevronRight } from "lucide-react";

function Paginacao({ paginaAtual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from(
    { length: totalPaginas },
    (_, indice) => indice + 1,
  );

  return (
    <nav className="paginacao" aria-label="Paginação de usuários">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={paginaAtual === 1}
        onClick={() => onChange(paginaAtual - 1)}
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>

      <div className="paginacao-numeros">
        {paginas.map((pagina) => (
          <button
            key={pagina}
            type="button"
            className={pagina === paginaAtual ? "ativa" : ""}
            aria-label={`Ir para a página ${pagina}`}
            aria-current={pagina === paginaAtual ? "page" : undefined}
            onClick={() => onChange(pagina)}
          >
            {pagina}
          </button>
        ))}
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
