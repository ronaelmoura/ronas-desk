import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import "./clientes.css";

function NovoClienteModal({ fechar, onSave, cliente }) {
  const [formulario, setFormulario] = useState({
    nome: cliente?.nome || "",
    email: cliente?.email || "",
    telefone: cliente?.telefone || "",
    empresa: cliente?.empresa || "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const modalRef = useRef(null);
  const primeiroCampoRef = useRef(null);
  const salvandoRef = useRef(false);

  useEffect(() => {
    salvandoRef.current = salvando;
  }, [salvando]);

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    primeiroCampoRef.current?.focus();

    function controlarTeclado(event) {
      if (event.key === "Escape" && !salvandoRef.current) {
        fechar();
        return;
      }

      if (event.key !== "Tab") return;

      const elementos = [
        ...(modalRef.current?.querySelectorAll(
          "button:not(:disabled), input:not(:disabled)",
        ) ?? []),
      ];
      const primeiro = elementos[0];
      const ultimo = elementos.at(-1);

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo?.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro?.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);

    return () => {
      document.removeEventListener("keydown", controlarTeclado);
      elementoAnterior?.focus?.();
    };
  }, [fechar]);

  function alterar(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
    setErro("");
  }

  async function salvar(event) {
    event.preventDefault();
    if (salvando) return;

    setSalvando(true);
    setErro("");

    try {
      await onSave({
        nome: formulario.nome.trim(),
        email: formulario.email.trim(),
        telefone: formulario.telefone.trim(),
        empresa: formulario.empresa.trim(),
      });
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  function fecharPeloFundo(event) {
    if (event.target === event.currentTarget && !salvando) fechar();
  }

  return (
    <div className="cliente-modal-overlay" onMouseDown={fecharPeloFundo}>
      <section
        className="cliente-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-modal-titulo"
        aria-describedby="cliente-modal-descricao"
        aria-busy={salvando}
      >
        <header className="cliente-modal-header">
          <div>
            <p>{cliente ? "Atualizar cadastro" : "Novo cadastro"}</p>
            <h2 id="cliente-modal-titulo">
              {cliente ? "Editar cliente" : "Novo cliente"}
            </h2>
            <span id="cliente-modal-descricao">
              Informe os dados usados no atendimento.
            </span>
          </div>

          <button
            className="cliente-modal-fechar"
            type="button"
            onClick={fechar}
            disabled={salvando}
            aria-label="Fechar formulário"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="cliente-form" onSubmit={salvar}>
          <label className="cliente-campo" htmlFor="cliente-nome">
            <span>Nome</span>
            <input
              id="cliente-nome"
              ref={primeiroCampoRef}
              name="nome"
              type="text"
              autoComplete="name"
              required
              maxLength="120"
              value={formulario.nome}
              onChange={alterar}
            />
          </label>

          <label className="cliente-campo" htmlFor="cliente-email">
            <span>E-mail</span>
            <input
              id="cliente-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength="160"
              value={formulario.email}
              onChange={alterar}
            />
          </label>

          <div className="cliente-form-grid">
            <label className="cliente-campo" htmlFor="cliente-telefone">
              <span>Telefone</span>
              <input
                id="cliente-telefone"
                name="telefone"
                type="tel"
                autoComplete="tel"
                maxLength="30"
                value={formulario.telefone}
                onChange={alterar}
              />
            </label>

            <label className="cliente-campo" htmlFor="cliente-empresa">
              <span>Empresa</span>
              <input
                id="cliente-empresa"
                name="empresa"
                type="text"
                autoComplete="organization"
                maxLength="120"
                value={formulario.empresa}
                onChange={alterar}
              />
            </label>
          </div>

          {erro && (
            <p className="cliente-form-erro" role="alert">
              {erro}
            </p>
          )}

          <div className="cliente-modal-acoes">
            <button
              className="cliente-btn-cancelar"
              type="button"
              onClick={fechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              className="cliente-btn-salvar"
              type="submit"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default NovoClienteModal;
